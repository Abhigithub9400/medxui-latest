export interface ResultResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}