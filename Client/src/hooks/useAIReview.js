import { useState, useCallback, useRef } from 'react';
import { getToken } from '../auth';

export function useAIReview(endpoint = '/ai/review') {
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'streaming' | 'done' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef(null);
  const lastArgsRef = useRef(null);

  const runReview = useCallback(async (code, language) => {
    if (!code?.trim()) {
      setStatus('error');
      setErrorMsg('No code to review.');
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setOutput('');
    setErrorMsg('');
    setStatus('loading');

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

    try {
      const res = await fetch(`${serverUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ code, language }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Request failed (${res.status})`);
      }

      setStatus('streaming');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? ''; // keep incomplete trailing event in buffer

        for (const evt of events) {
          const line = evt.replace(/^data:\s*/, '').trim();
          if (!line) continue;

          try {
            const parsed = JSON.parse(line);
            if (parsed.chunk) {
              setOutput(prev => prev + parsed.chunk);
            }
            if (parsed.error) {
              setErrorMsg(parsed.error);
              setStatus('error');
            }
            if (parsed.done) {
              setStatus('done');
            }
          } catch {
            // Incomplete JSON fragment — ignore, next chunk will complete it
          }
        }
      }

      // If stream ended without an explicit "done" event
      setStatus(prev => (prev === 'streaming' ? 'done' : prev));
    } catch (err) {
      if (err.name === 'AbortError') return; // user cancelled, not a real error
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong.');
    }
  }, [endpoint]);


  const runReviewTracked = useCallback((code, language) => {
  lastArgsRef.current = {
    code,
    language
  };

  runReview(code, language);
}, [runReview]);


const regenerate = useCallback(() => {
  if (lastArgsRef.current) {
    runReview(
      lastArgsRef.current.code,
      lastArgsRef.current.language
    );
  }
}, [runReview]);

const clear = useCallback(() => {
  setOutput('');
  setStatus('idle');
  setErrorMsg('');
}, []);


  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
  }, []);

return {
  output,
  status,
  errorMsg,
  runReview: runReviewTracked,
  regenerate,
  clear,
  cancel
};}