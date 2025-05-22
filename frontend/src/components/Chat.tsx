import { JSX, useState } from "react";

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

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Chat(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! How can I assist you today?" },
  ]);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string>("");

  const handleSubmit = () => {
    if (!input) return setError("Please enter a prompt.");
    if (ws) return setError("Please wait for the assistant to finish.");
    setError("");

    const newMessages = messages.concat({
      role: "user",
      content: input,
    });
    setMessages(newMessages);
    setInput("");

    const socket = new WebSocket("ws://localhost:8000/ws/generate");
    setWs(socket);

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          prompt: newMessages.map((m) => m.content).join("\n"),
        })
      );
    };

    socket.onmessage = (event) => {
      setMessages((prev) => {
        const isLastAssistant = prev[prev.length - 1]?.role === "assistant";
        if (isLastAssistant) {
          prev[prev.length - 1].content += event.data;
          return [...prev];
        }
        return [...prev, { role: "assistant", content: event.data }];
      });
    };

    socket.onerror = () => {
      setError("An error occurred while connecting to the server.");
    };

    socket.onclose = () => {
      setWs(null);
    };
  };

  return (
    <Box>
      <Fab onClick={() => setIsChatOpen((prev) => !prev)}>
        <img
          src="/assistant.png"
          alt="Assistant"
          style={{
            position: "fixed",
            zIndex: 1100,
            bottom: 50,
            right: 50,
            width: 75,
            height: 75,
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

        {error && <Alert severity="error">{error}</Alert>}

        <Stack sx={{ height: "100%", overflowY: "auto" }}>
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
                label={message.content}
                title={message.content}
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
            disabled={!input || !!ws}
          >
            <SendIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}
