/**
 * WebSocket client utility with authentication support
 * Similar to axiosInstance but for WebSocket connections
 */

import axiosInstance from "./axiosclient";

// Helper function to get WebSocket token from the server
async function getWebSocketToken(): Promise<string | null> {
  try {
    const response = await axiosInstance.get<{ websocket_token: string }>(
      "/api/auth/websocket-token"
    );

    if (response.status === 200 && response.data?.websocket_token) {
      console.log("Successfully obtained WebSocket token from server");
      return response.data.websocket_token;
    } else {
      console.warn("Failed to get WebSocket token:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching WebSocket token:", error);
    return null;
  }
}

interface WebSocketConfig {
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  protocols?: string | string[];
  initialMessage?: string | object; // Added support for initial message
}

class AuthenticatedWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;

  constructor(url: string, config: WebSocketConfig = {}) {
    this.url = url;
    this.config = config;
  }

  connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket connection
        // Note: For WSS connections with Secure cookies, we rely on the token
        // passed in the URL query parameters as cookies may not be sent
        console.log("Connecting to WebSocket:", this.url);
        this.ws = new WebSocket(this.url, this.config.protocols);

        this.ws.onopen = (event) => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0; // Reset on successful connection

          // Send initial message if provided
          if (this.config.initialMessage) {
            const message =
              typeof this.config.initialMessage === "string"
                ? this.config.initialMessage
                : JSON.stringify(this.config.initialMessage);
            this.ws!.send(message);
            console.log("Sent initial message:", message);
          }

          this.config.onOpen?.(event);
          resolve(this.ws!);
        };

        this.ws.onmessage = (event) => {
          this.config.onMessage?.(event);
        };

        this.ws.onclose = (event) => {
          console.log(
            "WebSocket disconnected:",
            this.url,
            event.code,
            event.reason
          );
          this.config.onClose?.(event);

          // Auto-reconnect on unexpected close (not manual close)
          if (
            !event.wasClean &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.reconnectAttempts++;
            console.log(
              `Reconnecting WebSocket (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
            );
            setTimeout(() => {
              this.connect().catch(console.error);
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };

        this.ws.onerror = (event) => {
          console.error("WebSocket error:", this.url, event);
          this.config.onError?.(event);

          // Provide more specific error messages for WSS issues
          const errorMessage = this.url.startsWith("wss://")
            ? "WSS connection failed - check SSL certificate and authentication"
            : "WebSocket connection failed";
          reject(new Error(errorMessage));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.warn("WebSocket is not open. ReadyState:", this.ws?.readyState);
    }
  }

  close(code?: number, reason?: string): void {
    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
    }
  }

  get readyState(): number | undefined {
    return this.ws?.readyState;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Create an authenticated WebSocket connection
 * Gets a temporary token from the server since HttpOnly cookies can't be read by JavaScript
 */
export const createAuthenticatedWebSocket = async (
  endpoint: string,
  config: WebSocketConfig = {}
): Promise<AuthenticatedWebSocket> => {
  // Get backend URL from environment
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "https://edumark.vihangamunasinghe.com";
  const wsProtocol = backendUrl.startsWith("https") ? "wss" : "ws";
  const host = backendUrl.replace(/^https?:\/\//, "");

  // Get WebSocket token from server (this uses HttpOnly cookies server-side)
  const wsToken = await getWebSocketToken();
  let wsUrl = `${wsProtocol}://${host}${endpoint}`;

  // Add token as query parameter if available
  if (wsToken) {
    const separator = endpoint.includes("?") ? "&" : "?";
    wsUrl += `${separator}token=${encodeURIComponent(wsToken)}`;
  } else {
    console.warn("No WebSocket token available - connection may fail");
  }

  return new AuthenticatedWebSocket(wsUrl, config);
};

/**
 * Utility function for common WebSocket promise pattern
 */
export const connectWebSocketWithPromise = <T = unknown>(
  endpoint: string,
  config: Omit<WebSocketConfig, "onMessage"> & {
    successCondition: (data: unknown) => boolean;
    errorCondition?: (data: unknown) => boolean;
    dataExtractor?: (data: unknown) => T;
    initialMessage?: string | object;
  }
): Promise<T> => {
  return new Promise<T>(async (resolve, reject) => {
    try {
      const ws = await createAuthenticatedWebSocket(endpoint, {
        ...config,
        initialMessage: config.initialMessage,
        onMessage: (event) => {
          try {
            const data = JSON.parse(event.data);

            // Check for error condition first
            if (config.errorCondition?.(data)) {
              reject(new Error(data.message || "WebSocket operation failed"));
              ws.close();
              return;
            }

            // Check for success condition
            if (config.successCondition(data)) {
              const result = config.dataExtractor
                ? config.dataExtractor(data)
                : data;
              resolve(result);
              ws.close();
              return;
            }

            // Handle other messages (like progress updates)
            console.log("WebSocket message:", data);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        },
        onError: (event) => {
          config.onError?.(event);
          reject(new Error("WebSocket connection failed"));
        },
      });

      ws.connect().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

export default createAuthenticatedWebSocket;
