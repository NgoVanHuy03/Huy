import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [isChatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [userField, setUserField] = useState("");
  const [currentField, setCurrentField] = useState("");
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [autoMessageCount, setAutoMessageCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0); // State variable for question count
  const [messageLimitReached, setMessageLimitReached] = useState(false); // New state for message limit

  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const userFieldRef = useRef(null);

  const toggleChat = () => {
    setChatOpen(!isChatOpen);
    setShowQuestions(false);
    if (isChatOpen) {
      setHasNewMessage(false);
    }
  };

  const handleSendMessage = async (message, isInternal = false) => {
    if (message.trim() === "") return;

    if (!isInternal) {
      setChatMessages((prevMessages) => [...prevMessages, { sender: "user", text: message }]);
      setQuestionCount((prevCount) => prevCount + 1); // Increment question count when user sends a message
    }

    try {
      const response = await fetch('http://localhost:5000/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, field: currentField }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
      }

      const data = await response.json();
      setChatMessages((prevMessages) => [...prevMessages, { sender: "ai", text: data.reply }]);
      setHasNewMessage(true);
      setAutoMessageCount(prevCount => prevCount + 1);
    } catch (error) {
      console.error('Error:', error);
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { sender: "ai", text: "Đã xảy ra lỗi khi gửi yêu cầu: " + error.message }
      ]);
      setHasNewMessage(true);
      setAutoMessageCount(prevCount => prevCount + 1);
    }
  };

  const handleKeyPressField = (e) => {
    if (e.key === 'Enter' && !messageLimitReached) { // Check if message limit is reached
      handleSubmit();
    }
  };

  const handleKeyPressMessage = (e) => {
    if (e.key === 'Enter' && !messageLimitReached) { // Check if message limit is reached
      handleSendMessage(inputMessage);
      setInputMessage("");
    }
  };

  const displayMessage = (text) => {
    setChatMessages((prevMessages) => [...prevMessages, { sender: "user", text }]);
  };

  const handleSubmit = () => {
    if (userField.trim() !== "") {
      if (!isChatOpen) {
        toggleChat();
      }
      displayMessage(userField);
      setCurrentField(userField);
      setAutoMessageCount(0);

      const questions = [
        `-Nên đầu tư hay không vào "${userField}" (chỉ cần trả lời là nên đầu từ hay không không cần lý do)`,
        `-Lý do nên đầu tư vào "${userField} không" (trả lời bằng những gạch đầu dòng dễ hiểu và có ghi tiêu đề lên trên câu trả lời).`,
        `-Thông số chứng minh "${userField}" là nên đầu tư (đưa ra những số liệu có tại Việt Nam trong những năm gần đây và không nếu lại lý do nên đầu tư hay không và ngắn gọn đầy đủ bằng những con số trả lời trong 300 token và có ghi tiêu đề 'Thông số chứng minh' lên trên câu trả lời).`
      ];

      questions.forEach((question, index) => {
        setTimeout(() => handleSendMessage(question, true), (index + 1) * 2000);
      });
    }
  };

  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const predefinedQuestions = [
    "Làm thế nào để sử dụng ứng dụng?",
    "Chức năng chính của ứng dụng là gì?",
    "Tôi có thể tìm trợ giúp ở đâu?",
    "Thông tin bảo mật của tôi được xử lý như thế nào?"
  ];

  const handleQuestionClick = (question) => {
    if (questionCount < 6) { // Check if question limit is reached
      handleSendMessage(question);
      setQuestionCount(prevCount => prevCount + 1); // Increment question count
      setShowQuestions(false);
    } else {
      alert("Đã đến giới hạn câu hỏi! Bạn không thể hỏi thêm.");
      setMessageLimitReached(true); // Set message limit reached state
    }
  };

  const toggleQuestions = () => {
    setShowQuestions((prev) => !prev);
  };

  useEffect(() => {
    if (chatMessages.length === 0 && autoMessageCount === 3) {
      setChatMessages([{ sender: "ai", text: "Tôi là AI, tôi có thể giúp gì được cho bạn?" }]);
    }
  }, [chatMessages, autoMessageCount]);

  useEffect(() => {
    if (questionCount >= 6) { // Check if question count reaches 6
      setMessageLimitReached(true); // Set message limit reached state
    }
  }, [questionCount]);

  return (
    <div className="App">
      <input
        type="text"
        placeholder="Nhập tên lĩnh vực..."
        value={userField}
        onChange={(e) => setUserField(e.target.value)}
        onKeyPress={handleKeyPressField}
        ref={userFieldRef}
        style={{ marginBottom: '20px', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
        disabled={messageLimitReached} // Disable input when message limit is reached
      />

      <button
        onClick={handleSubmit}
        style={{
          marginBottom: '20px',
          padding: '10px',
          fontSize: '16px',
          borderRadius: '5px',
          border: '1px solid #ccc',
          width: '10%',
        }}
        disabled={messageLimitReached} // Disable button when message limit is reached
      >
        Submit
      </button>

      <button className="chat-button" onClick={toggleChat}>
        💬
        {hasNewMessage && <span className="notification-dot"></span>}
      </button>

      {isChatOpen && (
        <div className="chat-box">
          <div className="chat-header">
            <h2>Chat</h2>
            <button className="close-button" onClick={toggleChat}>X</button>
          </div>

          <div className="chat-content" style={{ overflowY: 'scroll', height: '300px' }} ref={chatRef}>
            {chatMessages.map((message, index) => (
              <div key={index} className={message.sender === "ai" ? "ai-message" : "my-message"}>
                {message.sender === "ai" ? (
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                ) : (
                  <p>{message.text}</p>
                )}
              </div>
            ))}
          </div>

          {messageLimitReached && (
            <div className="message-limit-notification">
              Đã đến giới hạn câu hỏi! Bạn không thể gửi thêm tin nhắn.
            </div>
          )}

          <div className="question-prompt" onClick={toggleQuestions}>
            Bạn có muốn biết thêm thông tin gì nữa không?
          </div>

          {showQuestions && (
            <div className="question-box">
              <ul className="question-list">
                {predefinedQuestions.map((question, index) => (
                  <li
                    key={index}
                    className="question-item"
                    onClick={() => handleQuestionClick(question)}
                  >
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="chat-input-container">
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              className="chat-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPressMessage}
              disabled={messageLimitReached} // Disable input when message limit is reached
            />
            <button
              onClick={() => {
                handleSendMessage(inputMessage);
                setInputMessage("");
              }}
              disabled={messageLimitReached} // Disable button when message limit is reached
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
