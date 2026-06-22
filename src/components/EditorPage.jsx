import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import axios from 'axios';
import Editor from './Editor';
import socket from '../socket';

const GlobalTheme = createGlobalStyle`
  :root {
    --bg-primary:    ${({ $dark }) => ($dark ? '#0d0d0f' : '#f5f5f7')};
    --bg-secondary:  ${({ $dark }) => ($dark ? '#141418' : '#ffffff')};
    --bg-tertiary:   ${({ $dark }) => ($dark ? '#1c1c22' : '#ebebef')};
    --bg-hover:      ${({ $dark }) => ($dark ? '#22222a' : '#e0e0e8')};
    --border:        ${({ $dark }) => ($dark ? '#2a2a35' : '#d0d0dc')};
    --text-primary:  ${({ $dark }) => ($dark ? '#f0f0f5' : '#0d0d0f')};
    --text-secondary:${({ $dark }) => ($dark ? '#8888a0' : '#44445a')};
    --text-muted:    ${({ $dark }) => ($dark ? '#555565' : '#9090a8')};
    --accent: #7c6af7;
    --accent-glow: rgba(124,106,247,0.25);
    --accent-2: #4ade80;
    --danger: #ff5e5e;
    --font-mono: 'JetBrains Mono','Fira Code',monospace;
    --font-ui: 'Space Grotesk',sans-serif;
    --radius: 8px;
    --radius-lg: 14px;
    --shadow: 0 4px 24px rgba(0,0,0,0.4);
  }
`;

const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;
const slideIn = keyframes`from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}`;
const popIn = keyframes`from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}`;
const spin = keyframes`to{transform:rotate(360deg)}`;

const Layout = styled.div`display:flex;height:100vh;width:100vw;overflow:hidden;background:var(--bg-primary);`;

const Sidebar = styled.aside`
  width:${({$c})=>($c?'56px':'260px')};transition:width 0.25s ease;
  background:var(--bg-secondary);border-right:1px solid var(--border);
  display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;
`;
const SidebarHeader = styled.div`padding:16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;min-height:60px;`;
const LogoMark = styled.div`width:28px;height:28px;background:var(--accent);border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:#fff;flex-shrink:0;box-shadow:0 2px 8px var(--accent-glow);`;
const LogoName = styled.span`font-weight:700;font-size:15px;color:var(--text-primary);white-space:nowrap;span{color:var(--accent);}`;
const CollapseBtn = styled.button`margin-left:auto;width:24px;height:24px;background:none;color:var(--text-muted);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:14px;&:hover{background:var(--bg-hover);color:var(--text-primary);}`;
const SidebarSection = styled.div`padding:16px;border-bottom:1px solid var(--border);overflow:hidden;`;
const SectionLabel = styled.div`font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;white-space:nowrap;`;
const RoomIdBox = styled.div`background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px;display:flex;align-items:center;gap:8px;cursor:pointer;transition:border-color 0.2s;&:hover{border-color:var(--accent);}`;
const RoomIdText = styled.span`font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
const CopiedTag = styled.span`font-size:10px;background:var(--accent-2);color:#000;padding:2px 6px;border-radius:4px;font-weight:600;animation:${popIn} 0.2s ease;`;
const UserList = styled.div`display:flex;flex-direction:column;gap:8px;`;
const UserItem = styled.div`display:flex;align-items:center;gap:10px;animation:${slideIn} 0.3s ease both;`;
const Avatar = styled.div`width:28px;height:28px;border-radius:50%;background:${({$color})=>$color||'var(--accent)'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#0d0d0f;flex-shrink:0;position:relative;&::after{content:'';position:absolute;bottom:0;right:0;width:8px;height:8px;background:var(--accent-2);border-radius:50%;border:2px solid var(--bg-secondary);}`;
const UserName = styled.span`font-size:13px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const YouTag = styled.span`font-size:9px;background:var(--accent);color:#fff;padding:2px 5px;border-radius:3px;font-weight:700;`;

const Main = styled.main`flex:1;display:flex;flex-direction:column;overflow:hidden;`;
const Topbar = styled.div`height:60px;background:var(--bg-secondary);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:8px;flex-shrink:0;overflow-x:auto;`;
const LangSelect = styled.select`background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-primary);font-family:var(--font-mono);font-size:12px;padding:7px 10px;cursor:pointer;&:focus{border-color:var(--accent);}option{background:var(--bg-tertiary);}`;
const TopbarBtn = styled.button`padding:7px 12px;border-radius:var(--radius);font-size:12px;font-weight:600;transition:all 0.2s;white-space:nowrap;&.accent{background:var(--accent);color:#fff;&:hover{background:#8e7ef9;}}&.ghost{background:none;color:var(--text-secondary);border:1px solid var(--border);&:hover{color:var(--text-primary);border-color:var(--accent);}}&.active{background:var(--accent);color:#fff;border-color:var(--accent);}&.danger{background:none;color:var(--danger);border:1px solid transparent;&:hover{background:rgba(255,94,94,0.1);border-color:var(--danger);}}`;
const Spacer = styled.div`flex:1;min-width:8px;`;
const StatusDot = styled.span`width:8px;height:8px;border-radius:50%;background:${({$c})=>$c?'var(--accent-2)':'var(--danger)'};box-shadow:0 0 6px ${({$c})=>$c?'var(--accent-2)':'var(--danger)'};display:inline-block;flex-shrink:0;`;
const StatusText = styled.span`font-size:12px;color:var(--text-muted);font-family:var(--font-mono);white-space:nowrap;`;
const EditorArea = styled.div`flex:1;display:flex;overflow:hidden;`;

const OutputPanel = styled.div`
  height:${({$open})=>($open?'220px':'0')};transition:height 0.25s ease;
  border-top:1px solid ${({$open})=>($open?'var(--border)':'transparent')};
  background:var(--bg-primary);overflow:hidden;display:flex;flex-direction:column;flex-shrink:0;
`;
const OutputHeader = styled.div`padding:8px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--text-secondary);background:var(--bg-secondary);flex-shrink:0;`;
const OutputContent = styled.pre`flex:1;overflow-y:auto;padding:12px 16px;font-family:var(--font-mono);font-size:13px;line-height:1.6;color:${({$error})=>($error?'var(--danger)':'var(--accent-2)')};white-space:pre-wrap;word-break:break-word;`;
const OutputSpinner = styled.div`width:14px;height:14px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:${spin} 0.7s linear infinite;`;

const ChatPanel = styled.div`width:${({$open})=>($open?'260px':'0')};transition:width 0.25s ease;border-left:1px solid ${({$open})=>($open?'var(--border)':'transparent')};background:var(--bg-secondary);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;`;
const ChatHeader = styled.div`padding:14px 16px;border-bottom:1px solid var(--border);font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;`;
const ChatMessages = styled.div`flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;`;
const ChatMsg = styled.div`animation:${fadeIn} 0.3s ease both;`;
const ChatMsgUser = styled.span`font-size:11px;font-weight:700;color:${({$color})=>$color||'var(--accent)'};`;
const ChatMsgTime = styled.span`font-size:10px;color:var(--text-muted);font-family:var(--font-mono);margin-left:6px;`;
const ChatMsgText = styled.p`font-size:13px;color:var(--text-secondary);line-height:1.5;word-break:break-word;`;
const ChatInputRow = styled.div`padding:12px;border-top:1px solid var(--border);display:flex;gap:8px;`;
const ChatInputField = styled.input`flex:1;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;color:var(--text-primary);font-size:13px;&::placeholder{color:var(--text-muted);}&:focus{border-color:var(--accent);}`;
const ChatSendBtn = styled.button`background:var(--accent);color:#fff;border-radius:var(--radius);padding:8px 12px;font-size:14px;&:hover{background:#8e7ef9;}&:disabled{opacity:0.4;}`;
const Toast = styled.div`position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--bg-tertiary);border:1px solid var(--border);border-radius:999px;padding:10px 20px;font-size:13px;color:var(--text-secondary);animation:${fadeIn} 0.3s ease;z-index:1000;white-space:nowrap;box-shadow:var(--shadow);pointer-events:none;`;

const LANGUAGES = [
  'javascript','typescript','python','java','c','cpp','csharp',
  'go','rust','ruby','php','swift','kotlin','html','css','json','markdown','sql',
];

export default function EditorPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || 'Anonymous';
  const myColor = useRef('#7c6af7');

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [users, setUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [output, setOutput] = useState('');
  const [outputError, setOutputError] = useState(false);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState({});
  const isRemoteChange = useRef(false);
  const toastTimer = useRef(null);
  const messagesEndRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    socket.connect();
    socket.on('connect', () => { setConnected(true); socket.emit('join-room', { roomId, username }); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('load-room', ({ code: c, language: l }) => { isRemoteChange.current = true; setCode(c); setLanguage(l); });
    socket.on('code-update', (c) => { isRemoteChange.current = true; setCode(c); });
    socket.on('language-update', (l) => setLanguage(l));
    socket.on('users-update', (u) => { setUsers(u); const me = u.find(x => x.id === socket.id); if (me) myColor.current = me.color; });
    socket.on('cursor-update', ({ userId, line, column, username: uname, color }) => {
      setRemoteCursors(p => ({ ...p, [userId]: { line, column, username: uname, color } }));
    });
    socket.on('notification', ({ message }) => showToast(message));
    socket.on('chat-message', (msg) => setMessages(p => [...p, msg]));
    return () => { socket.off(); socket.disconnect(); };
  }, [roomId, username, showToast]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleCodeChange = useCallback((newCode) => {
    if (isRemoteChange.current) { isRemoteChange.current = false; return; }
    setCode(newCode);
    socket.emit('code-change', { roomId, code: newCode });
  }, [roomId]);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    socket.emit('language-change', { roomId, language: lang });
  };

  const handleCursorChange = useCallback(({ line, column }) => {
    socket.emit('cursor-move', { roomId, line, column, username, color: myColor.current });
  }, [roomId, username]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/editor/${roomId}`);
    showToast('🔗 Room link copied!');
  };

  const downloadCode = () => {
    const ext = { javascript:'js', typescript:'ts', python:'py', java:'java', c:'c', cpp:'cpp', csharp:'cs', go:'go', rust:'rs', ruby:'rb', php:'php', html:'html', css:'css', json:'json', markdown:'md', sql:'sql', swift:'swift', kotlin:'kt' };
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${ext[language] || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Code downloaded!');
  };

  const runCode = async () => {
    const supported = ['javascript','typescript','python','java','c','cpp','go','rust','ruby','php','swift','kotlin'];
    if (!supported.includes(language)) {
      setOutput(`❌ "${language}" is not supported for execution.`);
      setOutputError(true); setOutputOpen(true); return;
    }
    if (!code.trim()) { setOutput('⚠️ No code to run!'); setOutputError(true); setOutputOpen(true); return; }
    setRunning(true); setOutput(''); setOutputError(false); setOutputOpen(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/run', { code, language, username, roomId });
      if (data.error) { setOutput('❌ ' + data.error); setOutputError(true); }
      else if (data.hasError) { setOutput(data.stderr); setOutputError(true); }
      else { setOutput(data.stdout || '✅ Ran successfully with no output.'); setOutputError(false); }
    } catch (err) {
      setOutput('❌ ' + (err.response?.data?.error || err.message));
      setOutputError(true);
    } finally { setRunning(false); }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit('chat-message', { roomId, username, message: chatInput.trim(), color: myColor.current });
    setChatInput('');
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  return (
    <>
      <GlobalTheme $dark={darkMode} />
      <Layout>
        <Sidebar $c={sidebarCollapsed}>
          <SidebarHeader>
            <LogoMark>CC</LogoMark>
            {!sidebarCollapsed && <LogoName>Collab<span>Code</span></LogoName>}
            <CollapseBtn onClick={() => setSidebarCollapsed(v => !v)}>
              {sidebarCollapsed ? '›' : '‹'}
            </CollapseBtn>
          </SidebarHeader>
          {!sidebarCollapsed && (
            <>
              <SidebarSection>
                <SectionLabel>Room ID</SectionLabel>
                <RoomIdBox onClick={copyRoomId}>
                  <RoomIdText>{roomId}</RoomIdText>
                  {copied ? <CopiedTag>Copied!</CopiedTag> : <span style={{color:'var(--text-muted)'}}>⎘</span>}
                </RoomIdBox>
              </SidebarSection>
              <SidebarSection style={{flex:1,overflowY:'auto'}}>
                <SectionLabel>Online — {users.length}</SectionLabel>
                <UserList>
                  {users.map(u => (
                    <UserItem key={u.id}>
                      <Avatar $color={u.color}>{u.username.charAt(0).toUpperCase()}</Avatar>
                      <UserName>{u.username}</UserName>
                      {u.id === socket.id && <YouTag>YOU</YouTag>}
                    </UserItem>
                  ))}
                </UserList>
              </SidebarSection>
            </>
          )}
        </Sidebar>

        <Main>
          <Topbar>
            <StatusDot $c={connected} />
            <StatusText>{connected ? 'Connected' : 'Reconnecting…'}</StatusText>
            <LangSelect value={language} onChange={handleLanguageChange}>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </LangSelect>
            <Spacer />
            <TopbarBtn className="accent" onClick={runCode} disabled={running}>
              {running ? '⏳' : '▶'} Run
            </TopbarBtn>
            <TopbarBtn className="ghost" onClick={downloadCode}>⬇ Download</TopbarBtn>
            <TopbarBtn className="ghost" onClick={shareLink}>🔗 Share</TopbarBtn>
            <TopbarBtn className="ghost" onClick={() => setDarkMode(v => !v)}>
              {darkMode ? '☀️' : '🌙'}
            </TopbarBtn>
            <TopbarBtn className={chatOpen ? 'active' : 'ghost'} onClick={() => setChatOpen(v => !v)}>
              💬 {messages.length > 0 ? `(${messages.length})` : 'Chat'}
            </TopbarBtn>
            <TopbarBtn className="danger" onClick={() => navigate('/')}>✕ Leave</TopbarBtn>
          </Topbar>

          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <EditorArea>
              <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
                <Editor
                  code={code}
                  language={language}
                  onChange={handleCodeChange}
                  onCursorChange={handleCursorChange}
                  remoteCursors={remoteCursors}
                  darkMode={darkMode}
                />
                <OutputPanel $open={outputOpen}>
                  <OutputHeader>
                    <span>⚡ Output</span>
                    {running && <OutputSpinner />}
                    <button onClick={() => setOutputOpen(false)} style={{marginLeft:'auto',background:'none',color:'var(--text-muted)',fontSize:'14px',cursor:'pointer'}}>✕</button>
                  </OutputHeader>
                  <OutputContent $error={outputError}>
                    {running ? 'Running…' : output}
                  </OutputContent>
                </OutputPanel>
              </div>

              <ChatPanel $open={chatOpen}>
                <ChatHeader>💬 Team Chat</ChatHeader>
                <ChatMessages>
                  {messages.map((m, i) => (
                    <ChatMsg key={i}>
                      <div>
                        <ChatMsgUser $color={m.color}>{m.username}</ChatMsgUser>
                        <ChatMsgTime>{formatTime(m.timestamp)}</ChatMsgTime>
                      </div>
                      <ChatMsgText>{m.message}</ChatMsgText>
                    </ChatMsg>
                  ))}
                  <div ref={messagesEndRef} />
                </ChatMessages>
                <ChatInputRow>
                  <ChatInputField value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message…" onKeyDown={e => e.key === 'Enter' && sendChat()} />
                  <ChatSendBtn onClick={sendChat} disabled={!chatInput.trim()}>↑</ChatSendBtn>
                </ChatInputRow>
              </ChatPanel>
            </EditorArea>
          </div>
        </Main>

        {toast && <Toast>{toast}</Toast>}
      </Layout>
    </>
  );
}
