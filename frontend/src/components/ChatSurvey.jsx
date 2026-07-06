import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LIKERT_OPTIONS,
  CHAT_QUESTIONS,
  BEHAVIORAL_CHOICE_QUESTIONS,
  computeSubscaleScores,
} from "../chatSurveyData";
import { getStudentName } from "../utils/studentName";
import { submitPrediction } from "../api";

const numericBehavioralFields = [
  { key: "attendance_rate", label: "Attendance Rate (%)" },
  { key: "assignment_completion_rate", label: "Assignment Completion (%)" },
  { key: "late_submission_count", label: "Late Submissions (count)" },
  { key: "lms_login_frequency", label: "LMS Logins per week" },
  { key: "time_on_task_weekly", label: "Hours on Task per week" },
];

function ChatSurvey() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const displayName = getStudentName(studentId);

  const [stage, setStage] = useState("chat"); // chat -> choiceChat -> behavioral -> done
  const [qIndex, setQIndex] = useState(0);
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [choiceAnswers, setChoiceAnswers] = useState({});
  const [messages, setMessages] = useState([
    { from: "bot", text: `Hi ${displayName}, let's check in. ${CHAT_QUESTIONS[0].text}` },
  ]);
  const [behavioralData, setBehavioralData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAnswer = (option) => {
    const currentQ = CHAT_QUESTIONS[qIndex];
    setAnswers((prev) => ({ ...prev, [currentQ.id]: option.value }));

    const userMsg = { from: "user", text: `${option.emoji} ${option.label}` };
    const nextIndex = qIndex + 1;

    if (nextIndex < CHAT_QUESTIONS.length) {
      setMessages((prev) => [...prev, userMsg, { from: "bot", text: CHAT_QUESTIONS[nextIndex].text }]);
      setQIndex(nextIndex);
    } else {
      setMessages((prev) => [
        ...prev,
        userMsg,
        { from: "bot", text: "Got it. A couple quick questions about how things have been going academically." },
        { from: "bot", text: BEHAVIORAL_CHOICE_QUESTIONS[0].text },
      ]);
      setStage("choiceChat");
    }
  };

  const handleChoiceAnswer = (option) => {
    const currentQ = BEHAVIORAL_CHOICE_QUESTIONS[choiceIndex];
    setChoiceAnswers((prev) => ({ ...prev, [currentQ.field]: option.value }));

    const userMsg = { from: "user", text: `${option.emoji} ${option.label}` };
    const nextIndex = choiceIndex + 1;

    if (nextIndex < BEHAVIORAL_CHOICE_QUESTIONS.length) {
      setMessages((prev) => [
        ...prev,
        userMsg,
        { from: "bot", text: BEHAVIORAL_CHOICE_QUESTIONS[nextIndex].text },
      ]);
      setChoiceIndex(nextIndex);
    } else {
      setMessages((prev) => [
        ...prev,
        userMsg,
        { from: "bot", text: "Almost done — just a few numbers from your student portal, then we're finished." },
      ]);
      setStage("behavioral");
    }
  };

  const handleBehavioralChange = (e) => {
    setBehavioralData({ ...behavioralData, [e.target.name]: e.target.value });
  };

  const handleFinalSubmit = async () => {
    const subscaleScores = computeSubscaleScores(answers);
    const payload = { student_id: studentId, ...subscaleScores, ...choiceAnswers };
    for (const field of numericBehavioralFields) {
      payload[field.key] = parseFloat(behavioralData[field.key]) || 0;
    }

    setLoading(true);
    setError(null);
    try {
      await submitPrediction(payload);
      navigate(`/dashboard/${studentId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const totalSteps = CHAT_QUESTIONS.length + BEHAVIORAL_CHOICE_QUESTIONS.length;
  const currentStep =
    stage === "chat" ? qIndex : stage === "choiceChat" ? CHAT_QUESTIONS.length + choiceIndex : totalSteps;
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Check-in for {displayName}</h1>
      </div>

      <div className="card">
        <div style={{ background: "#eee", borderRadius: "6px", height: "8px", marginBottom: "1.2rem", overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "var(--mint)", transition: "width 0.3s" }} />
        </div>

        <div style={{ maxHeight: "420px", overflowY: "auto", marginBottom: "1rem", paddingRight: "0.5rem" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.from === "bot" ? "flex-start" : "flex-end", marginBottom: "0.6rem" }}>
              <div
                style={{
                  maxWidth: "75%",
                  padding: "0.6rem 0.9rem",
                  borderRadius: "14px",
                  background: m.from === "bot" ? "var(--dark2)" : "var(--mint)",
                  color: "white",
                  fontSize: "0.92rem",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {error && (
          <div style={{ color: "var(--high)", marginBottom: "1rem" }}>
            Error: {error}. Is the backend running at http://127.0.0.1:8000?
          </div>
        )}

        {stage === "chat" && (
          <div style={{ display: "flex", justifyContent: "space-around", gap: "0.5rem" }}>
            {LIKERT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt)}
                style={{ flex: 1, background: "white", border: "1px solid #ddd", borderRadius: "10px", padding: "0.6rem 0.3rem", cursor: "pointer", textAlign: "center" }}
              >
                <div style={{ fontSize: "1.6rem" }}>{opt.emoji}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{opt.label}</div>
              </button>
            ))}
          </div>
        )}

        {stage === "choiceChat" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {BEHAVIORAL_CHOICE_QUESTIONS[choiceIndex].options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleChoiceAnswer(opt)}
                style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "white", border: "1px solid #ddd", borderRadius: "10px", padding: "0.7rem 1rem", cursor: "pointer", fontSize: "0.95rem", textAlign: "left" }}
              >
                <span style={{ fontSize: "1.3rem" }}>{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {stage === "behavioral" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
              {numericBehavioralFields.map((f) => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>{f.label}</label>
                  <input
                    type="number"
                    step="0.1"
                    name={f.key}
                    value={behavioralData[f.key] || ""}
                    onChange={handleBehavioralChange}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                </div>
              ))}
            </div>
            <button className="primary-btn" onClick={handleFinalSubmit} disabled={loading}>
              {loading ? "Analyzing..." : "Submit Check-in"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatSurvey;