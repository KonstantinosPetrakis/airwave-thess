import { JSX, useState, useRef, useEffect } from "react";

import CircularProgress from "@mui/material/CircularProgress";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Fab from "@mui/material/Fab";
import Box from "@mui/material/Box";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { sendMessage } from "../network";
import { MessageRole, MessageList } from "../types";

export default function Chat(): JSX.Element {
  const [messages, setMessages] = useState<MessageList>([
    {
      role: MessageRole.ASSISTANT,
      content: "Hello! How can I assist you today?",
    },
  ]);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isChatOpen) return;
    messageContainerRef.current?.scrollTo({
      top: messageContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [isChatOpen, messages]);

  const handleSubmit = async () => {
    if (!input) return setError("Please enter a prompt.");
    if (isAssistantTyping)
      return setError("Please wait for the assistant to finish typing.");
    setError("");

    const newMessages = messages.concat({
      role: MessageRole.USER,
      content: input,
    });
    setMessages(newMessages);
    setInput("");

    setIsAssistantTyping(true);
    try {
      const newMessagesWithResult = await sendMessage(newMessages);
      setMessages(newMessagesWithResult);
    } catch {
      setError("Failed to send message");
    }
    setIsAssistantTyping(false);
  };

  return (
    <Box>
      <Fab
        onClick={() => setIsChatOpen((prev) => !prev)}
        sx={{
          position: "fixed",
          zIndex: 1100,
          bottom: 50,
          right: 50,
          width: 75,
          height: 75,
        }}
      >
        <img
          src="/assistant.png"
          alt="Assistant"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: "2px solid #000",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
          }}
        />
      </Fab>
      <Stack
        sx={{
          display: isChatOpen ? "flex" : "none",
          position: "fixed",
          zIndex: 1000,
          bottom: { xs: 0, sm: 50 + 75 + 16 },
          right: { xs: 0, sm: 50 },
          width: { xs: "100vw", sm: 400 },
          borderRadius: { xs: 0, sm: 2 },
          boxShadow: 3,
          padding: 2,
          height: { xs: "100vh", sm: 400 },
          backgroundColor: (theme) => theme.palette.background.paper,
          p: 3,
        }}
      >
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h6">Chat with Assistant</Typography>
          <IconButton
            onClick={() => setIsChatOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {isAssistantTyping && (
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              Assistant is typing...
            </Typography>
          </Stack>
        )}

        <Stack
          sx={{ height: "100%", overflowY: "auto", px: 1 }}
          ref={messageContainerRef}
        >
          {messages.map((message, index) => (
            <Stack
              key={index}
              direction="row"
              justifyContent={
                message.role === "user" ? "flex-end" : "flex-start"
              }
              sx={{ mb: 1 }}
            >
              <Chip
                label={
                  <Markdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {message.content.replace(/<think>[\s\S]*?<\/think>/gi, "")}
                  </Markdown>
                }
                color={message.role === "user" ? "primary" : "secondary"}
                variant="outlined"
                sx={{
                  fontSize: "0.875rem",
                  maxWidth: "80%",
                  borderRadius: 2,
                  height: "auto",
                  "& .MuiChip-label": {
                    display: "block",
                    whiteSpace: "normal",
                  },
                }}
              />
            </Stack>
          ))}
        </Stack>

        <Stack direction="row" sx={{ mt: "auto" }}>
          <TextField
            variant="outlined"
            size="small"
            fullWidth
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <IconButton
            color="primary"
            onClick={handleSubmit}
            disabled={!input || !!isAssistantTyping}
          >
            <SendIcon />
          </IconButton>
          <IconButton
            color="primary"
            onClick={() => {
              setMessages([
                {
                  role: MessageRole.ASSISTANT,
                  content: "Hello! How can I assist you today?",
                },
              ]);
              setInput("");
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}
