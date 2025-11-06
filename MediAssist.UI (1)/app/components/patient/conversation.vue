<script setup lang="ts">
import { defineProps } from "vue";
import waveformStatic from "@/assets/consultation/waveform-static.png";
import waveformAnimated from "@/assets/consultation/waveform-animated.gif";
import playIcon from "@/assets/icons/play-button.svg";
import pauseIcon from "@/assets/icons/pause-button.svg";
import type { Conversation } from "~/types/interfaces/Consultation";

const props = defineProps<{
  conversation: Conversation[];
  audioUrl: string;
}>();

const isPlaying = ref(false);
const audio = ref<HTMLAudioElement | null>(null);

const pausePlay = () => {
  if (!audio.value) return;

  if (audio.value.paused) {
    audio.value.play().catch(err => console.error("Play failed:", err));
  } else {
    audio.value.pause();
  }
};


const rewind = () => {
  if (audio.value) {
    audio.value.currentTime -= 5
  }
};

const forward = () => {
  if (audio.value) {
    audio.value.currentTime += 5
  }
};

watch(() => props.conversation, () => {
  if (audio.value) {
    audio.value.pause();
  }
  isPlaying.value = false;
});

onMounted(() => {
  if (!audio.value) return;
  audio.value.addEventListener('play', () => isPlaying.value = true);
  audio.value.addEventListener('pause', () => isPlaying.value = false);
  audio.value.addEventListener('ended', () => isPlaying.value = false);
});

</script>
<template>
    <div class="card-header">
        <div class="conversation-header">
            <h3 class="conversation-title">Your conversations</h3>
        </div>
    
        <div class="conversation-audio">
            <audio ref="audio" preload="auto" :src="audioUrl" @error="e => console.error('Audio error:', e)"
                @loadeddata="console.log('Audio loaded and ready')" style="opacity:0; width:0; height:0;"></audio>
    
            <div class="audio-control">
                <div class="control">
                    <img src="@/assets/icons/rewind-10s-back.svg" @click="rewind" alt="rewind-10s-back" />
                    <img :src="isPlaying ? pauseIcon : playIcon" @click="pausePlay" alt="pause or play" />
                    <img src="@/assets/icons/rewind-10s-forward.svg" @click="forward" alt="rewind-10s-forward" />
                </div>
            </div>
            <div class="wave-animation">
                <img v-for="n in 3" :key="'static-' + n" :src="waveformStatic" alt="Waveform Static" v-show="!isPlaying" />
    
                <!-- Animated images -->
                <img v-for="n in 12" :key="'anim-' + n" :src="waveformAnimated" alt="Waveform Animated"
                    v-show="isPlaying" />
            </div>
        </div>
    </div>
    
    <div class="messages">
        <div v-for="(chat, i) in conversation" :key="i" class="message" :class="{ patient: chat.speaker == 'Guest-1' }">
            <div class="conv-text" :class="{ patient: chat.speaker == 'Guest-2' }">
                {{ chat.text }}
            </div>
        </div>
    </div>
</template>

<style scoped>
@import "~/assets/css/components/patient/conversation.css";
</style>
