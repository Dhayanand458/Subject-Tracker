import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB6zWJIyy4yz0WHrNXI21EevZ-2t32WegI",
  authDomain: "subject-tracker-c9529.firebaseapp.com",
  projectId: "subject-tracker-c9529",
  storageBucket: "subject-tracker-c9529.appspot.com",
  messagingSenderId: "742374026099",
  appId: "1:742374026099:web:393b174cbc4b526cb17306"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const subjectsCol = collection(db, "subjects");

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const subjectsList = document.getElementById("subjects-list");
  const addSubjectBtn = document.getElementById("add-subject");
  const deleteModal = document.getElementById("delete-modal");
  const confirmDeleteBtn = document.getElementById("confirm-delete");
  const cancelDeleteBtn = document.getElementById("cancel-delete");
  const modalMessage = document.getElementById("modal-message");
  const toggleVisibilityIcon = document.getElementById("toggle-visibility");
  const invisibleModeIcon = document.getElementById("invisible-mode-toggle");

  // Constants
  const predefinedSubjects = ["Java", "ADA", "FOOS", "HRM", "principle of marketing - Minor", "Marketing (elective)"];

  // State Variables
  let subjects = [];
  let deleteSubjectId = null;
  let submitSubjectId = null;
  let isHidden = true;
  let invisibleMode = false;
  let nextPositionIndex = 1;

  // Initialize App
  initApp();

  async function initApp() {
    await loadSubjects();
    setupEventListeners();
    
    // Mobile-specific initialization
    if ('virtualKeyboard' in navigator) {
      navigator.virtualKeyboard.overlaysContent = true;
    }
  }

  async function loadSubjects() {
    try {
      const snapshot = await getDocs(subjectsCol);
      subjects = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || "",
          type: data.type || "",
          notes: data.notes || "",
          isNew: false,
          createdAt: data.createdAt?.toDate() || new Date(0),
          positionIndex: typeof data.positionIndex === "number" ? data.positionIndex : getNextPositionIndex(),
          isTemporary: false
        };
      });

      const validIndexes = subjects.map((s) => s.positionIndex).filter((i) => typeof i === "number");
      nextPositionIndex = validIndexes.length > 0 ? Math.max(...validIndexes) + 1 : 1;

      if (subjects.length > 0) {
        subjectsList.classList.remove("hidden");
      }

      renderSubjects();
    } catch (error) {
      console.error("Error loading subjects:", error);
      // Mobile-friendly error handling
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        alert("Failed to load data. Please check your connection.");
      }
    }
  }

  function getNextPositionIndex() {
    return nextPositionIndex++;
  }

  function renderSubjects() {
    subjectsList.innerHTML = "";

    const sortedSubjects = [...subjects].sort((a, b) => a.positionIndex - b.positionIndex);

    sortedSubjects.forEach((subject) => {
      const subjectElement = document.createElement("div");
      subjectElement.className = "subject-container";
      subjectElement.dataset.id = subject.id;

      if (subject.isNew) {
        subjectElement.setAttribute("data-new", "true");
      }

      subjectElement.innerHTML = `
        <div class="subject-header">
          <div class="subject-number">${subject.positionIndex}.</div>
          <select class="subject-name-select">
            <option value="">Select Name</option>
            ${predefinedSubjects
              .map(
                (name) =>
                  `<option value="${name}" ${
                    subject.name === name ? "selected" : ""
                  }>${name}</option>`
              )
              .join("")}
          </select>
          <select class="subject-type">
            <option value="">Select type</option>
            <option value="offline assignments" ${
              subject.type === "offline assignments" ? "selected" : ""
            }>Offline Assignments</option>
            <option value="online assignments" ${
              subject.type === "online assignments" ? "selected" : ""
            }>Online Assignments</option>
            <option value="Mini Test" ${
              subject.type === "Mini Test" ? "selected" : ""
            }>Mini Test</option>
            <option value="Test" ${
              subject.type === "Test" ? "selected" : ""
            }>Test</option>
            <option value="Exam" ${
              subject.type === "Exam" ? "selected" : ""
            }>Exam</option>
          </select>
        </div>
        <div class="subject-details">
          <textarea class="subject-notes" data-id="${subject.id}" placeholder="Enter notes here..." 
            inputmode="${invisibleMode ? 'text' : 'textarea'}">${subject.notes || ""}</textarea>
          <div class="subject-actions">
            <button class="btn btn-submit">Submit</button>
            <button class="btn btn-delete">Delete</button>
          </div>
        </div>
      `;

      const isNew = subjectElement.getAttribute("data-new") === "true";
      subjectElement.style.display = !isNew && isHidden ? "none" : "block";

      // Mobile optimization: prevent zoom on focus
      const textarea = subjectElement.querySelector("textarea");
      if (textarea) {
        textarea.addEventListener("focus", function() {
          if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            window.scrollTo(0, textarea.getBoundingClientRect().top + window.scrollY - 100);
          }
        });
      }

      subjectsList.appendChild(subjectElement);
    });

    applyInvisibleMode();
  }

  function toggleVisibility() {
    isHidden = !isHidden;
    toggleVisibilityIcon.innerHTML = isHidden ? 
      `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 6C15.79 6 19.17 8.13 20.82 11.5C19.17 14.87 15.79 17 12 17C8.21 17 4.83 14.87 3.18 11.5C4.83 8.13 8.21 6 12 6ZM12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 11.5C21.27 7.11 17 4 12 4ZM12 9C13.38 9 14.5 10.12 14.5 11.5C14.5 12.88 13.38 14 12 14C10.62 14 9.5 12.88 9.5 11.5C9.5 10.12 10.62 9 12 9ZM12 7C9.52 7 7.5 9.02 7.5 11.5C7.5 13.98 9.52 16 12 16C14.48 16 16.5 13.98 16.5 11.5C16.5 9.02 14.48 7 12 7Z" fill="currentColor"/>
      </svg>` :
      `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.83 9L15 12.16V12C15 10.34 13.66 9 12 9H11.83ZM4.53 9.82L6.08 11.37C6.03 11.56 6 11.77 6 12C6 13.66 7.34 15 9 15L9.59 14.98L10.49 15.88L9 17C7 17 5.5 15.5 5.5 13.5V10.5C5.5 10.13 5.6 9.76 5.71 9.41L4.53 9.82ZM17 7L19 9L20 8L16 4L13 7H17ZM22 12C22 14.58 20.09 16.83 17.5 17.5L19.5 19.5L21 18L18 15L15.5 17.5C14.98 17.18 14.5 16.8 14.07 16.37L20.73 9.71C21.5 10.77 22 11.89 22 12ZM2 4L4 6L5.5 4.5L3 2L1 4L2 5.5L2 4ZM16.17 15L13 11.83V12C13 13.66 14.34 15 16 15L16.17 15Z" fill="currentColor"/>
      </svg>`;
    
    document.querySelectorAll(".subject-container").forEach((container) => {
      const isNew = container.getAttribute("data-new") === "true";
      container.style.display = !isNew && isHidden ? "none" : "block";
    });
  }

  function applyInvisibleMode() {
    document.querySelectorAll(".subject-container").forEach((container) => {
      const textarea = container.querySelector("textarea.subject-notes");
      let input = container.querySelector("input.invisible-enabled");

      if (invisibleMode) {
        if (!input && textarea) {
          input = document.createElement("input");
          input.type = "password";
          input.className = "subject-notes invisible-enabled";
          input.value = textarea.value;
          input.placeholder = textarea.placeholder;
          input.dataset.id = textarea.dataset.id;
          input.inputMode = "text";

          input.addEventListener("input", () => {
            textarea.value = input.value;
          });

          textarea.style.display = "none";
          textarea.parentNode.insertBefore(input, textarea);
        }
      } else {
        if (input && textarea) {
          textarea.value = input.value;
          textarea.style.display = "";
          input.remove();
        }
      }
    });
  }

  function setupEventListeners() {
    // Touch event optimization
    const eventType = 'ontouchstart' in window ? 'touchstart' : 'click';
    
    addSubjectBtn.addEventListener(eventType, addNewSubject);
    subjectsList.addEventListener(eventType, handleSubjectAction);
    confirmDeleteBtn.addEventListener(eventType, confirmAction);
    cancelDeleteBtn.addEventListener(eventType, cancelAction);
    toggleVisibilityIcon.addEventListener(eventType, toggleVisibility);
    invisibleModeIcon.addEventListener(eventType, toggleInvisibleMode);
    window.addEventListener(eventType, closeModalOnOutsideClick);

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && deleteModal.classList.contains('active')) {
        cancelAction();
      }
    });
  }

  function addNewSubject(e) {
    // Prevent double-tap zoom on mobile
    if (e.type === 'touchstart') e.preventDefault();
    
    subjectsList.classList.remove("hidden");

    const newSubject = {
      id: "temp-" + Date.now(),
      name: "",
      type: "",
      notes: "",
      isNew: true,
      isTemporary: true,
      localCreatedAt: new Date(),
      positionIndex: getNextPositionIndex()
    };

    subjects.push(newSubject);
    renderSubjects();
    
    // Scroll to new element on mobile
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      setTimeout(() => {
        const lastSubject = subjectsList.lastElementChild;
        if (lastSubject) {
          lastSubject.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }

  function handleSubjectAction(e) {
    // Handle both mouse and touch events
    const target = e.target.closest('.btn-submit') || e.target.closest('.btn-delete');
    if (!target) return;

    const container = target.closest(".subject-container");
    if (!container) return;

    const id = container.dataset.id;
    const subject = subjects.find((s) => s.id === id);

    if (target.classList.contains("btn-submit")) {
      submitSubjectId = id;
      deleteSubjectId = null;
      modalMessage.textContent = "Are you sure you want to submit this subject?";
      deleteModal.classList.add("active");
    } else if (target.classList.contains("btn-delete")) {
      deleteSubjectId = id;
      submitSubjectId = null;
      modalMessage.textContent = "Are you sure you want to delete this subject?";
      deleteModal.classList.add("active");
    }
  }

  async function confirmAction(e) {
    if (e.type === 'touchstart') e.preventDefault();
    
    if (deleteSubjectId) {
      await deleteSubject();
    } else if (submitSubjectId) {
      await submitSubject();
    }
    deleteModal.classList.remove("active");
  }

  async function deleteSubject() {
    try {
      const subject = subjects.find((s) => s.id === deleteSubjectId);
      if (!subject.isTemporary) {
        await deleteDoc(doc(db, "subjects", deleteSubjectId));
      }

      subjects = subjects.filter((s) => s.id !== deleteSubjectId);

      if (subjects.length === 0) {
        subjectsList.classList.add("hidden");
      }

      renderSubjects();
    } catch (error) {
      console.error("Error deleting subject:", error);
      // Mobile-friendly error handling
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        alert("Failed to delete. Please try again.");
      }
    } finally {
      deleteSubjectId = null;
    }
  }

  async function submitSubject() {
    try {
      const subject = subjects.find((s) => s.id === submitSubjectId);
      const container = document.querySelector(`.subject-container[data-id="${submitSubjectId}"]`);

      if (subject && container) {
        subject.name = container.querySelector(".subject-name-select").value;
        subject.type = container.querySelector(".subject-type").value;
        subject.notes = container.querySelector(".subject-notes").value;
        subject.isNew = false;

        if (subject.isTemporary) {
          const docRef = await addDoc(subjectsCol, {
            name: subject.name,
            type: subject.type,
            notes: subject.notes,
            isNew: false,
            createdAt: serverTimestamp(),
            positionIndex: subject.positionIndex
          });
          subject.id = docRef.id;
          subject.isTemporary = false;
          subject.createdAt = new Date();
        } else {
          await updateDoc(doc(db, "subjects", submitSubjectId), {
            name: subject.name,
            type: subject.type,
            notes: subject.notes,
            isNew: false,
            positionIndex: subject.positionIndex
          });
        }

        container.removeAttribute("data-new");
        renderSubjects();
      }
    } catch (error) {
      console.error("Error submitting subject:", error);
      // Mobile-friendly error handling
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        alert("Failed to save. Please check your connection.");
      }
    } finally {
      submitSubjectId = null;
    }
  }

  function cancelAction(e) {
    if (e.type === 'touchstart') e.preventDefault();
    deleteModal.classList.remove("active");
    deleteSubjectId = null;
    submitSubjectId = null;
  }

  function toggleInvisibleMode(e) {
    if (e.type === 'touchstart') e.preventDefault();
    invisibleMode = !invisibleMode;
    invisibleModeIcon.innerHTML = invisibleMode ?
      `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
        <path d="M16.24 7.76C16.7979 8.31785 17.2405 8.98052 17.5424 9.71012C17.8443 10.4397 17.9998 11.2218 18 12C18 15.31 15.31 18 12 18C11.2218 18.0001 10.4397 17.8446 9.71012 17.5427C8.98052 17.2408 8.31785 16.7982 7.76 16.24L16.24 7.76ZM7.76 7.76L16.24 16.24C15.6822 15.6822 15.0195 15.2395 14.2899 14.9376C13.5603 14.6357 12.7782 14.4802 12 14.48V14.48C8.69 14.48 6 11.79 6 8.48C6 7.70181 6.15549 6.91972 6.45741 6.19012C6.75933 5.46052 7.20195 4.79785 7.759 4.24L7.76 4.24V7.76Z" fill="currentColor"/>
      </svg>` :
      `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
      </svg>`;
    applyInvisibleMode();
  }

  function closeModalOnOutsideClick(e) {
    if (e.target === deleteModal) {
      deleteModal.classList.remove("active");
      deleteSubjectId = null;
      submitSubjectId = null;
    }
  }
});


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log('Service worker registered.', reg));
}



// Prevent long-press text selection on mobile
document.addEventListener('contextmenu', function(e) {
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    e.preventDefault();
  }
});

