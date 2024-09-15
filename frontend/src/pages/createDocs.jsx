import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import React, { useState, useRef, useEffect } from 'react';
import JoditEditor from 'jodit-pro-react';
import { api_base_url } from '../Helper';

const PomodoroTimer = ({ onBreakChange }) => {
  const [time, setTime] = useState(1500); // 25 minutes in seconds
  const [isBreak, setIsBreak] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    let timer;
    if (isRunning && time > 0) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      if (!isBreak) {
        setIsBreak(true);
        setTime(300); // 5 minutes in seconds
        setNotification('Time for a break!');
        onBreakChange(true); // Notify parent component about the break
      } else {
        setIsBreak(false);
        setTime(1500); // 25 minutes in seconds
        setNotification('Break is over! Back to work.');
        onBreakChange(false); // Notify parent component that break is over
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, time, isBreak, onBreakChange]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(1500); // reset to 25 minutes for work
    setIsBreak(false);
    setNotification('');
    onBreakChange(false); // Notify parent component that timer is reset
  };

  const formatTime = () => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  return (
    <div className="pomodoro">
      <label>Pomodoro Timer</label>
      <div id="timer">{formatTime()}</div>
      <button className="b1" onClick={startTimer}>Start</button>
      <button className="b1" onClick={resetTimer}>Reset</button>
      {notification && (
        <div className="notification">
          <p>{notification}</p>
          <button onClick={() => setNotification('')}>Close</button>
        </div>
      )}
    </div>
  );
};

// Styles for Notification and PomodoroTimer
const styles = `
.pomodoro {
  text-align: center;
  font-family: Arial, sans-serif;
}

#timer {
  font-size: 2em;
  margin: 20px 0;
}

.b1 {
  margin: 5px;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.b1:hover {
  background-color: #0056b3;
}

.notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20px;
  background-color: #333;
  color: #fff;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.notification button {
  margin-top: 10px;
  background: #ff4d4d;
  border: none;
  color: white;
  padding: 5px 10px;
  cursor: pointer;
}

.editor-placeholder {
  pointer-events: none;
  opacity: 0.7;
  padding: 20px;
  border: 2px dashed #ccc;
  text-align: center;
  background-color: #f9f9f9;
}
`;

// Apply styles to the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const CreateDocs = () => {
  let { docsId } = useParams();
  const editor = useRef(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isBreak, setIsBreak] = useState(false); // State to manage break status

  const updateDoc = () => {
    fetch(api_base_url + '/uploadDoc', {
      mode: 'cors',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        userId: localStorage.getItem('userId'),
        docId: docsId,
        content: content,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success === false) {
          setError(data.message);
        } else {
          setError('');
        }
      });
  };

  const getContent = () => {
    fetch(api_base_url + '/getDoc', {
      mode: 'cors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: localStorage.getItem('userId'),
        docId: docsId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success === false) {
          setError(data.message);
        } else {
          setContent(data.doc.content);
        }
      })
      .catch((error) => {
        console.error('Error fetching document:', error);
        setError('An error occurred while fetching the document.');
      });
  };

  useEffect(() => {
    getContent();
  }, []);

  const handleBreakChange = (isOnBreak) => {
    setIsBreak(isOnBreak);
  };

  return (
    <>
      <Navbar />
      <div className="px-[100px] mt-3">
        <PomodoroTimer onBreakChange={handleBreakChange} />
        <div className="editor-wrapper" style={{ position: 'relative' }}>
          {isBreak ? (
            <div className="editor-placeholder">
              <p>Docify is disabled during breaks</p>
            </div>
          ) : (
            <JoditEditor
              ref={editor}
              value={content}
              tabIndex={1}
              onBlur={(newContent) => {
                setContent(newContent);
                updateDoc();
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default CreateDocs;
