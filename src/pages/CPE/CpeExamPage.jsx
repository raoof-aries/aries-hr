import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  LuAward, 
  LuSparkles, 
  LuCircleCheck, 
  LuCircleX, 
  LuRotateCcw, 
  LuChevronLeft, 
  LuChevronRight,
  LuFileText,
  LuCircleAlert
} from 'react-icons/lu';
import { DEFAULT_EXAM_QUESTIONS, TOTAL_EXAM_MARKS, PASSING_MARKS } from './cpeExamData';

const CpeExamPage = ({ video, onClose, onSubmitScore, onOpenCertificate }) => {
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const questions = DEFAULT_EXAM_QUESTIONS;
  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round(((currentIdx + 1) / questions.length) * 100);

  // Intercept back navigation during exam
  useEffect(() => {
    const handleBackAttempt = () => {
      if (!isSubmitted) {
        setShowExitConfirm(true);
      } else {
        onClose();
      }
    };

    window.addEventListener('cpe-exam-back-attempt', handleBackAttempt);
    return () => {
      window.removeEventListener('cpe-exam-back-attempt', handleBackAttempt);
    };
  }, [isSubmitted, onClose]);

  const handleSelectOption = (questionIndex, optionIndex) => {
    if (isSubmitted) return;
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleCalculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        score += 1;
      }
    });

    const passed = score >= PASSING_MARKS;
    const isFullMark = score === TOTAL_EXAM_MARKS;

    const evalResult = {
      score,
      total: TOTAL_EXAM_MARKS,
      passed,
      isFullMark,
      percentage: Math.round((score / TOTAL_EXAM_MARKS) * 100)
    };

    setResult(evalResult);
    setIsSubmitted(true);

    if (onSubmitScore) {
      onSubmitScore(video.id, score, passed, isFullMark);
    }
  };

  const handleReattend = () => {
    setAnswers({});
    setCurrentIdx(0);
    setIsSubmitted(false);
    setResult(null);
  };

  return (
    <div className="cpe-exam-page-container">
      
      {/* Top Title Section - Top navigation bar already has the back button */}
      <div className="cpe-exam-page-header">
        <div className="cpe-exam-page-header-info">
          <h2 className="cpe-exam-page-title">{video?.title || "Module Exam"}</h2>
          <span className="cpe-exam-page-subtitle">
            Assessment • {TOTAL_EXAM_MARKS} Marks • Pass: {PASSING_MARKS} Marks
          </span>
        </div>
      </div>

      {/* Main Page Content */}
      <div className="cpe-exam-page-content">
        {!isSubmitted ? (
          <div className="cpe-exam-card">
            
            {/* Clean Mobile Progress Header - No cluttered 1-20 grid */}
            <div className="cpe-exam-progress-header">
              <div className="cpe-exam-progress-labels">
                <span className="cpe-exam-progress-q">
                  Question <strong>{currentIdx + 1}</strong> of {questions.length}
                </span>
                <span className="cpe-exam-progress-ans">
                  {answeredCount} of {questions.length} Answered
                </span>
              </div>
              <div className="cpe-exam-progress-track">
                <div 
                  className="cpe-exam-progress-fill" 
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Question Section */}
            <div className="cpe-exam-question-block">
              <div className="cpe-exam-q-title-row">
                <span className="cpe-exam-q-badge">Q{currentIdx + 1}</span>
                <h3 className="cpe-exam-q-heading">{currentQuestion.question}</h3>
              </div>

              {/* Options */}
              <div className="cpe-exam-options-group">
                {currentQuestion.options.map((option, optIdx) => {
                  const isSelected = answers[currentIdx] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      className={`cpe-exam-option-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(currentIdx, optIdx)}
                    >
                      <span className="cpe-exam-option-circle">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="cpe-exam-option-label">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Nav: Previous & Next / Submit (Mobile Friendly) */}
            <div className="cpe-exam-page-nav">
              <button
                type="button"
                className="cpe-exam-page-nav-btn cpe-nav-prev"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              >
                <LuChevronLeft size={18} />
                <span>Previous</span>
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  type="button"
                  className="cpe-exam-page-nav-btn cpe-nav-next"
                  onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                >
                  <span>Next</span>
                  <LuChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="cpe-exam-page-nav-btn cpe-nav-submit"
                  onClick={handleCalculateScore}
                >
                  <LuAward size={18} />
                  <span>Submit Exam</span>
                </button>
              )}
            </div>

          </div>
        ) : (
          /* Results View */
          <div className="cpe-exam-result-page">
            <div className={`cpe-exam-result-card ${result.isFullMark ? 'full-mark' : result.passed ? 'passed' : 'failed'}`}>
              <div className="cpe-result-icon-wrap">
                {result.isFullMark ? (
                  <LuSparkles size={52} className="cpe-icon-gold" />
                ) : result.passed ? (
                  <LuCircleCheck size={52} className="cpe-icon-green" />
                ) : (
                  <LuCircleX size={52} className="cpe-icon-red" />
                )}
              </div>

              <h2 className="cpe-result-title">
                {result.isFullMark 
                  ? "Full Marks Achieved!" 
                  : result.passed 
                    ? "Congratulations! You Passed!" 
                    : "Assessment Not Passed"}
              </h2>

              <div className="cpe-result-score-box">
                <div className="cpe-result-big-score">
                  <span className="cpe-score-num">{result.score}</span>
                  <span className="cpe-score-total">/ {result.total}</span>
                </div>
                <span className="cpe-result-pct-tag">{result.percentage}% Score</span>
              </div>

              <p className="cpe-result-desc">
                {result.isFullMark ? (
                  "Outstanding work! You scored full marks (20 / 20). No re-attend is needed for this module."
                ) : result.passed ? (
                  `Great job! You achieved ${result.score} marks, meeting the pass criteria (minimum 15 / 20). You have the option to re-attend if you want to aim for full marks.`
                ) : (
                  `You scored ${result.score} marks. A minimum of 15 / 20 marks is required to pass and unlock the certificate. Please re-attend the exam.`
                )}
              </p>

              <div className="cpe-result-summary-grid">
                <div className="cpe-summary-metric">
                  <span className="metric-label">Pass Mark</span>
                  <strong className="metric-val">{PASSING_MARKS} / {TOTAL_EXAM_MARKS}</strong>
                </div>
                <div className="cpe-summary-metric">
                  <span className="metric-label">Your Score</span>
                  <strong className={`metric-val ${result.passed ? 'color-pass' : 'color-fail'}`}>
                    {result.score} Marks
                  </strong>
                </div>
                <div className="cpe-summary-metric">
                  <span className="metric-label">Certificate</span>
                  <strong className="metric-val">
                    {result.passed ? 'Unlocked' : 'Locked'}
                  </strong>
                </div>
              </div>

              <div className="cpe-exam-result-page-actions">
                {/* Only show Re-attend if not full mark */}
                {!result.isFullMark && (
                  <button
                    type="button"
                    className="cpe-exam-btn cpe-exam-btn-reattend"
                    onClick={handleReattend}
                  >
                    <LuRotateCcw size={16} />
                    <span>Re-attend Exam</span>
                  </button>
                )}

                {result.passed && onOpenCertificate && (
                  <button
                    type="button"
                    className="cpe-exam-btn cpe-exam-btn-cert"
                    onClick={() => {
                      onClose();
                      onOpenCertificate(video);
                    }}
                  >
                    <LuAward size={16} />
                    <span>View Certificate</span>
                  </button>
                )}

                <button
                  type="button"
                  className="cpe-exam-btn cpe-exam-btn-done"
                  onClick={onClose}
                >
                  <span>Back to Modules</span>
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Exit Quiz Confirmation Popup - Full Screen Portal */}
      {showExitConfirm && createPortal(
        <div className="cpe-modal-overlay" onClick={() => setShowExitConfirm(false)}>
          <div className="cpe-exit-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cpe-exit-confirm-icon-wrap">
              <LuCircleAlert size={36} className="cpe-exit-confirm-icon" />
            </div>
            
            <h3 className="cpe-exit-confirm-title">Exit Assessment Exam?</h3>
            
            <p className="cpe-exit-confirm-desc">
              Are you sure you want to leave? Your current quiz progress and answers will not be saved.
            </p>

            <div className="cpe-exit-confirm-actions">
              <button
                type="button"
                className="cpe-exit-btn cpe-exit-btn-cancel"
                onClick={() => setShowExitConfirm(false)}
              >
                Continue Exam
              </button>
              
              <button
                type="button"
                className="cpe-exit-btn cpe-exit-btn-confirm"
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default CpeExamPage;
