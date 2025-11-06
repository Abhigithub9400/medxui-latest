import { ref, onBeforeUnmount } from "vue";
import type { Conversation } from "@/types/interfaces/Consultation";
import {toast} from  "vue-sonner";

let transcriptionSocket: WebSocket | null = null;
let audioSocket: WebSocket | null = null;
let audioContext: AudioContext | null = null;
let workletNode: AudioWorkletNode | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;
let mediaRecorder;
let audioFile : string;

const isSocketOpen = ref(false);

export function useTranscription() {
  const conversation = ref<Conversation[]>([]);
  const cumulativeTranscript = ref("");
  const SuggestedDiagnosisList = ref(null);
  const errorMessage = ref(false);
  const generatedPrescriptions = reactive({
    items: [] as string[],
    editIndex: -1,
  });
  const recording = ref(false);
  const showPlanExpired = ref(false);
  const showSessionWillEndSoon = ref(false);
  const sessionPaused = ref(false);
  const consultationId = ref<number | null>(null);
  const isSessionEnded = ref(false);
  const toastError ="Connection could not be established. Please try again shortly.";

  let pingInterval: number | null = null;

  /* General send with payload */
  const send = (eventName: string, payload: any = {}) => {
    if (isSocketOpen.value && transcriptionSocket?.readyState === WebSocket.OPEN) {
      transcriptionSocket.send(JSON.stringify({ event_name: eventName, payload }));
    }
  };

  /* Send without payload */
  const sendEvent = (eventName: string) => {
    if (isSocketOpen.value && transcriptionSocket?.readyState === WebSocket.OPEN) {
      transcriptionSocket.send(JSON.stringify({ event_name: eventName }));
    }
  };

  const startTranscription = async (params: {
    userId: string;
    sessionId: string | number;
    totalToken: number;
    totalCost: number;
    showDiagnosis: boolean;
    selectedLanguage: string;
    selectedModel: string;
    PatientId: number;
  }) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new AudioContext();
    const sampleRate = audioContext.sampleRate;

    await audioContext.audioWorklet.addModule("/pcm-processor.js");

    sourceNode = audioContext.createMediaStreamSource(stream);
    workletNode = new AudioWorkletNode(audioContext, "pcm-processor");

    audioFile = crypto.randomUUID().replace(/-/g, "");
      openTranscriptionSocket(sampleRate, params,audioFile); 
    openAudioSocket(stream,audioFile);
    
    workletNode.port.onmessage = (e) => {
      if (
        isSocketOpen.value &&
        transcriptionSocket?.readyState === WebSocket.OPEN &&
        !sessionPaused.value
      ) {
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(e.data))
        );
        send("trigger_process", {
          audio_chunk: base64Audio,
          notes: [],
        });
      }
    };
    
    sourceNode.connect(workletNode);
  };

  const openAudioSocket = async (stream: MediaStream, audioFile: string) => {
  const webSocketUrl = useWebSocketUrl();
  audioSocket = new WebSocket(`${webSocketUrl}/consultation/audio/save`);

  audioSocket.onopen = () => handleSocketOpen(stream, audioFile);

  audioSocket.onerror = (error) => {
    stopTranscription();
    toast.error(toastError, { duration: 5000 });
    errorMessage.value = true;
  };
};

function handleSocketOpen(stream: MediaStream, audioFile: string) {
  mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });

  // send initial file info
  audioSocket?.send(JSON.stringify({ audioFile }));

  mediaRecorder.ondataavailable = (event) => handleDataAvailable(event);

  mediaRecorder.start(2000); // 2s chunks
}

function handleDataAvailable(event: BlobEvent) {
  if (audioSocket && audioSocket.readyState === WebSocket.OPEN && event.data.size > 0) {
    sendAudioChunk(event);
  }
}

function sendAudioChunk(event: BlobEvent) {
  event.data.arrayBuffer().then((buffer) => {
    audioSocket?.send(buffer); // send binary directly
  });
}


  const openTranscriptionSocket = ( 
    sampleRate: number,
    params: {
      userId: string;
      sessionId: string | number;
      totalToken: number;
      totalCost: number;
      showDiagnosis: boolean;
      selectedLanguage: string;
      selectedModel: string;
      PatientId: number;
    },
    audioFile: string
  ) => {
    const webSocketUrl = useWebSocketUrl();
    transcriptionSocket = new WebSocket(`${webSocketUrl}/consultation/transcription`);
    transcriptionSocket.binaryType = "arraybuffer";
    transcriptionSocket.onerror = (error) => { 
      toast.error(toastError, { duration: 5000 });
      errorMessage.value = true;
    };

    transcriptionSocket.onopen = () => {
      transcriptionSocket?.send(
        JSON.stringify({
          UserId: params.userId,
          SessionId: params.sessionId,
          TotalToken: params.totalToken,
          TotalCost: params.totalCost,
          IsPotentialDiagnosisOn: params.showDiagnosis,
          PatientId: params.PatientId,
          AudioFile: audioFile
        })
      );

      isSocketOpen.value = true;

      send("start", {
        language: params.selectedLanguage,
        enable_diarization: true,
        sample_rate: sampleRate,
        diagnosis_flag: params.showDiagnosis,
        transcriber_type: params.selectedModel,
      });

      pingInterval = window.setInterval(() => {
        if (transcriptionSocket && transcriptionSocket.readyState === WebSocket.OPEN) {
          transcriptionSocket.send(JSON.stringify({ event_name: "ping" }));
        }
      }, 30000);
    };

    transcriptionSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (!data) return;
        switch (data.type) {
          case "Message": //Azure
            if (data.text) {
              conversation.value.push({
                speaker: data.speakerId,
                text: data.text,
              });
              cumulativeTranscript.value += `${data.text}`;
            }
            break;
          case "Messages": // google
            if (Array.isArray(data.chat)) {
              conversation.value = data.chat.map(
                (item: { Sender: string; Text: string }) => ({
                  sender:
                    "Guest-" + parseInt(item.Sender.replace(/\D+/g, ""), 10),
                  text: item.Text,
                })
              );
            }
            break;
          case "Medicines":
            generatedPrescriptions.items = data.list;
            break;
          case "Diagnosis":
            SuggestedDiagnosisList.value = data.list;
            break;
          case "Status":
            if (data.status === "toExpire") {
              showPlanExpired.value = true;
              showSessionWillEndSoon.value = true;
            } else if (data.status === "started" || data.status === "resumed") {
              recording.value = true;
            } else if (data.status === "stopped") {
              consultationId.value = data.ConsultationId;
              isSessionEnded.value = true;
            }
            break;
            case "error":
              toast.error(toastError, { duration: 5000 });
              errorMessage.value = true;
        }      
    };
    transcriptionSocket.onclose = () => {
      stopTranscription();
      isSocketOpen.value = false;
    };
  };

  const stopTranscription = () => {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    if (transcriptionSocket && transcriptionSocket.readyState === WebSocket.OPEN) {
      transcriptionSocket.close();
    }
    transcriptionSocket = null;
    if(audioSocket && audioSocket.readyState === WebSocket.OPEN){
      audioSocket.close();
    }
    audioSocket = null;
    if (workletNode) {
      workletNode.disconnect();
      workletNode = null;
    }
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }

    recording.value = false;
  };

  onBeforeUnmount(() => {
    stopTranscription();
  });

  return {
    conversation,
    cumulativeTranscript,
    SuggestedDiagnosisList,
    generatedPrescriptions,
    recording,
    showPlanExpired,
    showSessionWillEndSoon,
    startTranscription,
    stopTranscription,
    send,
    sendEvent,
    isSocketOpen,
    consultationId,
    isSessionEnded,
    audioFile,
    errorMessage,
  };
}
