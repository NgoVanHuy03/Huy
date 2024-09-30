from flask import Flask, request, jsonify
from flask_cors import CORS
import openai

# Truyền trực tiếp API key vào đây
openai.api_key = "your-api"

app = Flask(__name__)
CORS(app)

# Biến toàn cục để lưu lịch sử chat
chat_history = []

def ask_gpt(prompt, chat_history):
    try:
        # Thêm câu hỏi người dùng vào lịch sử hội thoại
        chat_history.append({"role": "user", "content": prompt})

        # Gửi toàn bộ lịch sử hội thoại
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=chat_history,
            max_tokens=2000,
            temperature=0.4
        )
        
        # Thêm câu trả lời AI vào lịch sử hội thoại
        answer = response['choices'][0]['message']['content'].strip()
        chat_history.append({"role": "assistant", "content": answer})

        return answer
    except Exception as e:
        return f"Đã xảy ra lỗi: {str(e)}"

@app.route("/api/message", methods=["POST"])
def message():
    global chat_history  # Sử dụng biến toàn cục để lưu trữ lịch sử chat
    # Reset chat history on every new request
    chat_history = []  # Reset chat history to start fresh
    data = request.get_json()
    prompt = data.get("message", "").strip()  # Strip whitespace to avoid empty messages

    if not prompt:
        return jsonify({"error": "No message provided"}), 400

    # Gọi hàm ask_gpt với prompt và lịch sử hội thoại
    answer = ask_gpt(prompt, chat_history)

    return jsonify({"reply": answer})

@app.route("/api/reset", methods=["POST"])
def reset():
    global chat_history
    chat_history = []  # Xóa lịch sử hội thoại
    return jsonify({"message": "Chat history has been reset"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
