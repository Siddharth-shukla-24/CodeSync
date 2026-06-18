export interface User {
  name: string;
  isYou?: boolean;
}

export type Language = 'javascript' | 'python' | 'cpp' | 'java';

export type AIStatus = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

export interface Message {
  sender: string;
  message: string;
  time: string;
  isMe?: boolean;
}