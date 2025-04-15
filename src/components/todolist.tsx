'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../app/lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [fadeTheme, setFadeTheme] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    const showDeadlineAlert = () => {
      const now = new Date().getTime();
      const warningTasks = tasks.filter((task) => {
        const deadlineTime = new Date(task.deadline).getTime();
        const daysLeft = Math.floor((deadlineTime - now) / (1000 * 60 * 60 * 24));
        return daysLeft < 8 && daysLeft >= 0 && !task.completed;
      });

      if (warningTasks.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: '⚠ Perhatian!',
          text: 'Ada tugas yang mendekati deadline, tolong kerjakan!',
          confirmButtonText: 'Oke, siap!',
        });
      }
    };

    if (tasks.length > 0) showDeadlineAlert();
  }, [tasks]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setDarkMode(initialDark);
    if (initialDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    const isDark = !darkMode;
    setFadeTheme(true);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    setTimeout(() => setFadeTheme(false), 400);
  };

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;
    if (difference <= 0) return 'Waktu habis!';
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    return `${days}h ${hours}j ${minutes}m ${seconds}d`;
  };

  const addTask = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambahkan Tugas Baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => [
        (document.getElementById('swal-input1') as HTMLInputElement)?.value,
        (document.getElementById('swal-input2') as HTMLInputElement)?.value,
      ],
    });

    if (formValues && formValues[0] && formValues[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
      Swal.fire({
        icon: 'success',
        title: 'Tugas berhasil ditambahkan!',
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  const editTask = async (task: Task) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Tugas',
      html:
        `<input id="swal-input1" class="swal2-input" value="${task.text}" placeholder="Nama tugas">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${task.deadline}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => [
        (document.getElementById('swal-input1') as HTMLInputElement)?.value,
        (document.getElementById('swal-input2') as HTMLInputElement)?.value,
      ],
    });

    if (formValues && formValues[0] && formValues[1]) {
      const updatedTask = { ...task, text: formValues[0], deadline: formValues[1] };
      await updateDoc(doc(db, 'tasks', task.id), {
        text: updatedTask.text,
        deadline: updatedTask.deadline,
      });
      setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
      Swal.fire({
        icon: 'success',
        title: 'Tugas berhasil diperbarui!',
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  const toggleTask = async (id: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    await updateDoc(doc(db, 'tasks', id), {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));
    Swal.fire({
      icon: 'success',
      title: 'Tugas berhasil dihapus!',
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const handleCheckbox = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleMultiDelete = async () => {
    if (selectedTasks.length === 0) return;
    const confirm = await Swal.fire({
      title: `Yakin ingin hapus ${selectedTasks.length} tugas?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      await Promise.all(selectedTasks.map((id) => deleteDoc(doc(db, 'tasks', id))));
      setTasks(tasks.filter((task) => !selectedTasks.includes(task.id)));
      setSelectedTasks([]);
      Swal.fire('Dihapus!', 'Tugas terpilih telah dihapus.', 'success');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: fadeTheme ? 0.5 : 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white transition-colors duration-300 px-4"
    >
      <div className="max-w-xl mx-auto mt-10 p-6 bg-gray-100 dark:bg-gray-800 shadow-lg rounded-lg transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-300">
            📋 To-Do List
          </h1>
          <button
            onClick={toggleTheme}
            className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-3 py-1 rounded"
          >
            {darkMode ? '☀ Light' : '🌙 Dark'}
          </button>
        </div>

        <div className="flex justify-between mb-6">
          <button
            onClick={addTask}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded"
          >
            ➕ Tambah Tugas
          </button>
          {selectedTasks.length > 0 && (
            <button
              onClick={handleMultiDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              🗑 Hapus Terpilih ({selectedTasks.length})
            </button>
          )}
        </div>

        <ul className="space-y-3">
          <AnimatePresence>
            {tasks.map((task) => {
              const timeLeft = timeRemaining[task.id] || 'Menghitung...';
              const isExpired = timeLeft === 'Waktu habis!';
              const taskColorClass = task.completed
                ? 'bg-green-500'
                : isExpired
                ? 'bg-gray-600'
                : 'bg-orange-400';

              return (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 rounded-lg shadow-sm border text-white ${taskColorClass}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => handleCheckbox(task.id)}
                      />
                      <span
                        onClick={() => toggleTask(task.id)}
                        className={`cursor-pointer ${
                          task.completed ? 'line-through text-gray-300' : 'font-medium'
                        }`}
                      >
                        {task.text}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editTask(task)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 text-sm rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-sm rounded"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <p className="text-sm">📅 Deadline: {new Date(task.deadline).toLocaleString()}</p>
                  <p className="text-xs font-semibold mt-1">⏳ {timeLeft}</p>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </motion.div>
  );
}
