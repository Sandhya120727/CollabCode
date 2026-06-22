import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import styled, { keyframes } from 'styled-components';

// ── Animations ──────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%       { opacity: 0.8; transform: scale(1.05); }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
`;

// ── Styled Components ────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
    top: -200px;
    left: -200px;
    animation: ${pulse} 6s ease-in-out infinite;
    pointer-events: none;
  }
  &::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(74, 222, 128, 0.08) 0%, transparent 70%);
    bottom: -100px;
    right: -100px;
    animation: ${pulse} 8s ease-in-out infinite reverse;
    pointer-events: none;
  }
`;

const Card = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 48px;
  width: 100%;
  max-width: 480px;
  animation: ${fadeUp} 0.6s ease both;
  position: relative;
  z-index: 1;
  box-shadow: var(--shadow), 0 0 0 1px rgba(124, 106, 247, 0.1);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
`;

const LogoDot = styled.div`
  width: 10px;
  height: 10px;
  background: var(--accent-2);
  border-radius: 50%;
  box-shadow: 0 0 12px var(--accent-2);
  animation: ${pulse} 2s ease-in-out infinite;
`;

const LogoText = styled.h1`
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  span { color: var(--accent); }
`;

const Tagline = styled.p`
  font-size: 13px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  &::after {
    content: '|';
    color: var(--accent);
    animation: ${blink} 1s step-end infinite;
  }
`;

const Title = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 36px;
  line-height: 1.6;
`;

const Label = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  margin-bottom: 20px;

  &::placeholder { color: var(--text-muted); }
  &:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 20px;
  color: var(--text-muted);
  font-size: 12px;
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }
`;

const Btn = styled.button`
  width: 100%;
  padding: 13px 20px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  margin-bottom: 12px;
  letter-spacing: 0.3px;

  &.primary {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 4px 14px var(--accent-glow);
    &:hover {
      background: #8e7ef9;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px var(--accent-glow);
    }
    &:active { transform: translateY(0); }
  }

  &.secondary {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    &:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
      border-color: var(--accent);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const ErrorMsg = styled.p`
  color: var(--danger);
  font-size: 13px;
  margin-top: -12px;
  margin-bottom: 16px;
`;

// ── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validate = () => {
    if (!username.trim()) { setError('Please enter a username.'); return false; }
    if (username.trim().length < 2) { setError('Username must be at least 2 characters.'); return false; }
    setError('');
    return true;
  };

  const createRoom = () => {
    if (!validate()) return;
    const newRoom = uuidv4().slice(0, 8);
    navigate(`/editor/${newRoom}`, { state: { username: username.trim() } });
  };

  const joinRoom = () => {
    if (!validate()) return;
    if (!roomId.trim()) { setError('Please enter a Room ID to join.'); return; }
    navigate(`/editor/${roomId.trim()}`, { state: { username: username.trim() } });
  };

  return (
    <Page>
      <Card>
        <Logo>
          <LogoDot />
          <LogoText>Collab<span>Code</span></LogoText>
          <Tagline>live</Tagline>
        </Logo>

        <Title>Start Coding Together</Title>
        <Subtitle>
          Create a room or join an existing one to collaborate in real-time with your team.
        </Subtitle>

        <Label>Your Name</Label>
        <Input
          type="text"
          placeholder="e.g. Alex"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && createRoom()}
          maxLength={24}
        />

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <Btn className="primary" onClick={createRoom} disabled={!username.trim()}>
          ＋ Create New Room
        </Btn>

        <Divider>or join existing</Divider>

        <Label>Room ID</Label>
        <Input
          type="text"
          placeholder="Paste room ID here"
          value={roomId}
          onChange={(e) => { setRoomId(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
        />

        <Btn className="secondary" onClick={joinRoom} disabled={!username.trim() || !roomId.trim()}>
          → Join Room
        </Btn>
      </Card>
    </Page>
  );
}
