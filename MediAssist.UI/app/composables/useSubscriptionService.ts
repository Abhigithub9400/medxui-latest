import { ref } from "vue";
import { useApiBaseUrl } from "~/composables/useRuntimeEnv";

interface RazorpayOrderResponse {
    success: boolean;
    message?: string;
    data: {
        id: string;
        amount: number;
        currency: string;
        keyId: string;
        planId: number;
    };
}

export function useSubscriptionService() {
    const status = {
        isLoading: ref(false),
        isError: ref(false),
    };

    const isAnnual = ref(false);

    const modal = {
        showModal: ref(false),
        title: ref(""),
        message: ref(""),
        description: ref(""),
    };

    const currentPlan = ref("");
    const baseUrl = useApiBaseUrl();

    const showPaymentError = () => {
        status.isLoading.value = false;
        status.isError.value = true;
        modal.title.value = "Error!";
        modal.message.value = modal.message.value || "Your payment has failed.";
        modal.description.value = "You can retry payment below to continue.";
        modal.showModal.value = true;
    };

    const payNow = async (planId: number, userId: string, country: string) => {
        let razorPayorderId = "";
        let razorPayPaymentID = "";
        const isAnnual = ref(false);

        try {
            const response: RazorpayOrderResponse = await $fetch(
                `${baseUrl}/payment/create`,
                {
                    method: "POST",
                    credentials: "include",
                    body: {
                        PlanId: planId,
                        UserId: userId,
                        RazorpayOrderId: "",
                        RazorpayPaymentId: "",
                        isAnnual: isAnnual.value,
                        Notes: {
                            applicationId: "MEDX-WEB",
                            country: country
                        },
                    },
                }
            );

            razorPayorderId = response.data.id;
            const keyId = response.data.keyId;

            const options: any = {
                key: keyId,
                amount: response.data.amount,
                currency: response.data.currency,
                name: "MedinoteX",
                description: "Advanced Plan Payment",
                id: razorPayorderId,
                order_id: razorPayorderId,
                config: {
                    display: {
                        email: false,
                        contact: false,
                    },
                },
                handler: async (r: any) => {
                    status.isLoading.value = true;
                    let paymentStatus = "";

                    try {
                        const verifyResponse = await $fetch(
                            `${baseUrl}/payment/status?razorpayOrderId=${r.razorpay_order_id}`,
                            {
                                method: "GET",
                                credentials: "include",
                            }
                        );

                        paymentStatus = verifyResponse.success ? verifyResponse.data : paymentStatus;

                        if (paymentStatus === "ORDER PAID") {
                            status.isLoading.value = false;
                            modal.title.value = "Thank You!";
                            modal.message.value = "Payment done Successfully";
                            modal.description.value =
                                "Your payment has been processed and verified.";
                            modal.showModal.value = true;

                            if (planId === 2) {
                                currentPlan.value = "pro";
                            } else if (planId === 3) {
                                currentPlan.value = "advanced";
                            } else {
                                currentPlan.value = "free";
                            }
                        } else {
                            showPaymentError();
                        }
                    } catch (error) {
                        showPaymentError();
                    }
                },
                prefill: {
                    email: "",
                    contact: "",
                },
                modal: {
                    ondismiss: async () => {
                        await $fetch(`${baseUrl}/payment/cancel`, {
                            method: "POST",
                            credentials: "include",
                            body: {
                                PlanId: planId,
                                UserId: userId,
                                RazorpayOrderId: razorPayorderId,
                                RazorpayPaymentId: "",
                                isAnnual: false,
                            },
                        });
                    },
                },
                theme: {
                    color: "#3399cc",
                },
            };

            const rzp = new (window as any).Razorpay(options);

            rzp.on("payment.failed", async function (response: any) {
                await $fetch(`${baseUrl}/payment/cancel`, {
                    method: "POST",
                    credentials: "include",
                    body: {
                        PlanId: planId,
                        UserId: userId,
                        RazorpayOrderId: razorPayorderId,
                        RazorpayPaymentId: "",
                        isAnnual: false,
                    },
                });

                status.isLoading.value = false;
                status.isError.value = true;
                modal.title.value = "Error!";
                modal.message.value =
                    modal.message.value || "Your payment has failed.";
                modal.description.value =
                    response.error.description || "Please try again.";
                modal.showModal.value = true;
            });

            rzp.open();
        } catch (error) {
            showPaymentError();
        }
    };

    return {
        payNow,
        status,
        modal,
        currentPlan,
        isAnnual
    };
}
