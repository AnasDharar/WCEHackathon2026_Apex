"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebaseConfig"; 
import { doc, updateDoc } from "firebase/firestore"; 

const TestPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = auth.currentUser;
  const [error, setError] = useState("");

  // Raw state holding the 1-5 Likert values and boolean answers
  const [answers, setAnswers] = useState({
    // 1-5 Scale Questions (0 means unanswered)
    q_mood1: 0, q_mood2: 0,
    q_stress1: 0, q_stress2: 0,
    q_anx1: 0, q_anx2: 0,
    q_sleep: 0,
    q_energy: 0,
    q_screentime: 0,
    // Boolean Behavioral Checks
    exercise: null,
    social: null,
    productive: null,
    self_care: null,
    // Text
    journal: ""
  });

  const handleLikertChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleBooleanChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateResults = () => {
    // Math logic to translate 1-5 scales into your exact JSON schema
    const mapQuality = (val) => val <= 2 ? "Poor" : val === 3 ? "Fair" : "Good";
    const mapLevel = (val) => val <= 2 ? "Low" : val === 3 ? "Medium" : "High";
    const mapScreen = (val) => val <= 2 ? "Low" : val === 3 ? "Normal" : "High";

    return {
      mood: answers.q_mood1 + answers.q_mood2,         // (1-5) + (1-5) = 2 to 10
      stress: answers.q_stress1 + answers.q_stress2,     // (1-5) + (1-5) = 2 to 10
      anxiety: answers.q_anx1 + answers.q_anx2,          // (1-5) + (1-5) = 2 to 10
      sleep_quality: mapQuality(answers.q_sleep),
      energy: mapLevel(answers.q_energy),
      exercise: answers.exercise || false,
      social: answers.social || false,
      productive: answers.productive || false,
      screen_time: mapScreen(answers.q_screentime),
      self_care: answers.self_care || false,
      journal: answers.journal
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const user = auth.currentUser;
    
    // Basic Validation: Ensure all Likert and Boolean questions are answered
    const isComplete = Object.entries(answers).every(([key, val]) => {
      if (key === 'journal') return true; // Optional
      return val !== 0 && val !== null;
    });

    if (!isComplete) {
      setError("Please answer all questions to complete your assessment.");
      // Scroll to top to see error
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    const compiledData = calculateResults();
    const payload = { uid: user.uid, responses: compiledData };

    try {
      const response = await fetch("http://localhost:8000/api/v1/recommend-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to analyze assessment");

      // Mark test as completed in Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { testGiven: true });

      router.push("/home");
    } catch (err) {
      console.error(err);
      setError("Failed to submit assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
    // 3. Save the results and mark test as completed in Firestore
      const userRef = doc(db, "users", user.uid);
      
      await updateDoc(userRef, { 
        testGiven: true,
        // Save the actual test results under a new object
        latestAssessment: compiledData,
        // Optional: save the exact time they took it
        lastTestDate: new Date().toISOString() 
      });
  };

  // Reusable UI Component for Likert Scale Questions
  const LikertQuestion = ({ id, text }) => {
    const options = [
      { val: 1, label: "Strongly Disagree" },
      { val: 2, label: "Disagree" },
      { val: 3, label: "Neutral" },
      { val: 4, label: "Agree" },
      { val: 5, label: "Strongly Agree" }
    ];

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-4">
        <p className="font-medium text-gray-800 mb-4">{text}</p>
        <div className="grid grid-cols-5 gap-2">
          {options.map((opt) => (
            <button
              type="button"
              key={opt.val}
              onClick={() => handleLikertChange(id, opt.val)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-all ${
                answers[id] === opt.val 
                  ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold" 
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="md:hidden">{opt.val}</span>
              <span className="hidden md:block text-xs text-center">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Reusable UI Component for Yes/No Questions
  const BinaryQuestion = ({ id, text }) => (
    <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-4">
      <p className="font-medium text-gray-800 w-2/3">{text}</p>
      <div className="flex gap-2 w-1/3 justify-end">
        <button
          type="button"
          onClick={() => handleBooleanChange(id, true)}
          className={`px-6 py-2 rounded-lg border transition-all ${
            answers[id] === true ? "bg-green-50 border-green-500 text-green-700" : "bg-gray-50 border-gray-200 text-gray-600"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => handleBooleanChange(id, false)}
          className={`px-6 py-2 rounded-lg border transition-all ${
            answers[id] === false ? "bg-red-50 border-red-500 text-red-700" : "bg-gray-50 border-gray-200 text-gray-600"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 font-google">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Initial Assessment</h1>
          <p className="text-gray-600">Please indicate how much you agree with the following statements based on your recent experiences.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">Section 1: Mental & Emotional State</h2>
          <LikertQuestion id="q_mood1" text="I generally feel optimistic and hopeful about the future." />
          <LikertQuestion id="q_mood2" text="I find joy and pleasure in my daily activities." />
          
          <LikertQuestion id="q_stress1" text="I frequently feel overwhelmed by my responsibilities." />
          <LikertQuestion id="q_stress2" text="I find it difficult to relax and unwind after a long day." />
          
          <LikertQuestion id="q_anx1" text="I often feel nervous, anxious, or on edge." />
          <LikertQuestion id="q_anx2" text="I have trouble stopping or controlling my worrying." />

          <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">Section 2: Physical Wellbeing</h2>
          <LikertQuestion id="q_sleep" text="I wake up feeling rested and refreshed most days." />
          <LikertQuestion id="q_energy" text="I have sufficient energy to complete my daily tasks." />
          <LikertQuestion id="q_screentime" text="I spend an excessive amount of time mindlessly looking at screens." />

          <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">Section 3: Behavioral Check-in</h2>
          <BinaryQuestion id="exercise" text="Did you engage in at least 20 minutes of physical activity recently?" />
          <BinaryQuestion id="social" text="Have you had a meaningful conversation with a friend or family member today?" />
          <BinaryQuestion id="productive" text="Were you able to focus and complete your necessary tasks today?" />
          <BinaryQuestion id="self_care" text="Did you set aside dedicated time for yourself to do something you enjoy?" />

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors text-lg shadow-md"
          >
            {isSubmitting ? "Processing..." : "Complete Assessment"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default TestPage;