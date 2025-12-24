import { defineStore } from 'pinia'
import { useApiBaseUrl } from "~/composables/useRuntimeEnv";

interface UserActivityMetrics {
    Transcriptions: number;
    AvailableHours: number;
    SessionDurationLimit: number;
    RealTimeResults: boolean | null;
    PriorityAccessToTheLatestModels: boolean | null;
    WatermarkRemoval: boolean;
    UserSessionsCount: number;
    CurrentPlanName: string;
    CountryName: string;
    PlanPricing: PlanInfo[]; 
}
interface PlanInfo {
    pricingId: number;   
    planId: number;      
    amount: number;      
}
interface MediAssistConfig {
  DomainName: string | null
  SupportEmail: string | null
}

interface UserConfigResponse {
  success: boolean
  message?: string
  data: {
  transcriptions: number
  availableHours: number
  sessionDurationLimit: number
  realTimeResults: boolean | null
  priorityAccessToTheLatestModels: boolean | null
  watermarkRemoval: boolean
  userSessionsCount: number
  currentPlanName: string
  countryName: string
  planPricing: PlanInfo[];
  }
}

interface GlobalConfigResponse {
  success: boolean
  message?: string
  data: {
  domainName: string | null
  supportEmail: string | null
  }
}

export const useMyStore = defineStore('myStore', {
  state: () => ({
    UserActivityMetrics: <UserActivityMetrics>{
      Transcriptions: 0,
      AvailableHours: 0,
      SessionDurationLimit: 0,
      RealTimeResults: null,
      PriorityAccessToTheLatestModels: null,
      WatermarkRemoval: true,
      CurrentPlanName: '',
      UserSessionsCount: 0,
      CountryName: ''
    },
    MediAssistConfigManager: <MediAssistConfig>{
      DomainName: null,
      SupportEmail: null,
    }
  }),

  actions: {

    async fetchUserActivityMetrics(userid: string) {
      const baseUrl = useApiBaseUrl();
      try {
        const response = await $fetch<UserConfigResponse>(`${baseUrl}/user/config`, {
          method: 'GET',
          params: { userid },
          credentials: 'include'
        })
       if (!response.success) {
          return
        }
        this.UserActivityMetrics.Transcriptions = response.data.transcriptions
        this.UserActivityMetrics.AvailableHours = response.data.availableHours
        this.UserActivityMetrics.SessionDurationLimit = response.data.sessionDurationLimit
        this.UserActivityMetrics.RealTimeResults = response.data.realTimeResults
        this.UserActivityMetrics.PriorityAccessToTheLatestModels = response.data.priorityAccessToTheLatestModels
        this.UserActivityMetrics.WatermarkRemoval = response.data.watermarkRemoval
        this.UserActivityMetrics.UserSessionsCount = response.data.userSessionsCount
        this.UserActivityMetrics.CurrentPlanName = response.data.currentPlanName
        this.UserActivityMetrics.CountryName = response.data.countryName
        this.UserActivityMetrics.PlanPricing = response.data.planPricing
      } catch (error) {
        console.error('Error fetching user activity metrics:', error)
      }
    },

    async fetchGlobalConfigurations() {
      const baseUrl = useApiBaseUrl();
      try {
        const response = await $fetch<GlobalConfigResponse>(`${baseUrl}/config/get`, {
          method: 'GET',
          credentials: 'include'
        })
        if (!response.success) {
          return
        }
        this.MediAssistConfigManager.DomainName = response.data.domainName
        this.MediAssistConfigManager.SupportEmail = response.data.supportEmail
      } catch (error) {
        console.error('Error fetching config values:', error)
      }
    }
  }
})
