class ApiResponse {
  constructor(status, message, data) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.success = status >= 200 && status < 300;
  }

  static success(message, data = null) {
    return new ApiResponse(200, message, data);
  }

  static created(message, data = null) {
    return new ApiResponse(201, message, data);
  }
}

export default ApiResponse;
