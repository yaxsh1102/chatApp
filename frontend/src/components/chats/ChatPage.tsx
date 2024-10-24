import React, { useEffect, useRef, useState, useCallback } from 'react';
import Message from './Message';
import { IoMdSend } from "react-icons/io";
import { useAppContext } from '../../context/AppContext';
import { CiCircleInfo } from "react-icons/ci";
import socket from '../../socket';
import useSocketMessages from '../hooks/useSocketMessages';
import useSocketChats from '../hooks/useSocketChats';
import { FaArrowLeft } from "react-icons/fa";
import Loader from '../miscellaneous/Loader';

const ChatPage: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [typing, setTyping] = useState<boolean>(false);
  const [showTyping, setShowTyping] = useState<boolean>(false);
  const [typerName, setTyperName] = useState<string>("");
  const[loading , setLoading]= useState<boolean>(false)
  
  const {
    currentChat,
    setChatMessages,
    chatMessages,
    setCurrentMessages,
    currentMessages,
    setLoader,
    setShowGroupInfo,
    setCurrentChat,
    setChats,
    user ,
    chats
  } = useAppContext();

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!currentChat) return;

    setLoading(true)
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}message/get-messages/${currentChat._id}`, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setChatMessages(prev => [...prev, { chatId: currentChat._id, messages: data.data }]);
      setCurrentMessages(data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [currentChat, setChatMessages, setCurrentMessages, setLoader]);

  useSocketMessages(setCurrentMessages);
  useSocketChats(currentChat);

  useEffect(() => {
    if (!currentChat) return;

    const existingChat = chatMessages.find(chat => chat.chatId === currentChat._id);
    if (existingChat) {
      setCurrentMessages(existingChat.messages);
    } else {
      fetchMessages();
    }
  }, [currentChat?._id, chatMessages, setCurrentMessages, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, scrollToBottom]);

  useEffect(() => {
    if (!currentChat || !user) return;

    const markAsRead = async () => {
      try {
        await fetch(`${process.env.REACT_APP_BACKEND_URL}message/mark-as-read/${currentChat._id}`, {
          method: "PUT",
          headers: {
            "Content-type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          }
        });

        const updatedChat = {
          ...currentChat,
          unreadBy: currentChat.unreadBy.filter((id) => id !== user._id),
        };

        setCurrentChat(updatedChat);
        setChats((prevChats) =>
          prevChats.map((oldChat) => (oldChat._id === currentChat._id ? updatedChat : oldChat))
        );
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markAsRead();
  }, [currentChat?._id, user?._id]);

  useEffect(() => {
    const handleShowTyping = (name: string) => {
      setShowTyping(true);
      setTyperName(name);
    };

    const handleStopTypingNotification = () => {
      setShowTyping(false);
    };

    socket.on("showTyping", handleShowTyping);
    socket.on("stopShowingTyping", handleStopTypingNotification);

    return () => {
      socket.off("showTyping", handleShowTyping);
      socket.off("stopShowingTyping", handleStopTypingNotification);
    };
  }, []);

  const handleStartTyping = useCallback(() => {
    if (!typing && currentChat && user) {
      setTyping(true);
      socket.emit("startTyping", {
        chatId: currentChat._id,
        members: currentChat.members,
        sender: user._id,
        name: user.name
      });
    }
  }, [typing, currentChat, user]);

  const handleStopTyping = useCallback(() => {
    if (currentChat && user) {
      setTyping(false);
      socket.emit("stopTyping", {
        chatId: currentChat._id,
        members: currentChat.members,
        sender: user._id
      });
    }
  }, [currentChat, user]);

  const sendMessageHandler = async () => {
    if (!currentChat || message.trim().length === 0) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}message/send-message/${currentChat._id}`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ content: message })
      });

      const resp = await response.json();
      setCurrentMessages(prev => [...prev, resp.data]);
      handleStopTyping();
      setMessage("");
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    if (newMessage.length > 0) {
      handleStartTyping();
    } else {
      handleStopTyping();
    }
  };


 
  if (!currentChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-white">
        <h2 className="text-2xl font-semibold mb-4">Welcome to ChatPage</h2>
        <p className="text-lg text-gray-300">
          Select a chat or create a new conversation by clicking on <span className="font-bold text-indigo-500">New Chat</span>.
        </p>
      </div>
    );
      }

  const name = currentChat.groupChat 
    ? currentChat.name
    : (currentChat.members[0]._id === user?._id 
      ? currentChat.members[1].name 
      : currentChat.members[0].name);

      const avatar = currentChat.groupChat 
      ? currentChat.name
      : (currentChat.members[0]._id === user?._id 
        ? currentChat.members[1].avatar 
        : currentChat.members[0].avatar);

  return (
    <div className='w-full h-screen flex flex-col bg-gradient-to-tr from-[#1c1e22] to-[#434445]'>
   {loading ? <Loader text="loading messages"></Loader> :  (<><div className='h-16 min-h-[4rem] bg-[#262729] flex items-center text-2xl border-b-[0.1px] border-slate-700 justify-between px-4'>
        <div className='flex gap-x-4 items-center'>
          <p className='md:hidden flex hover:cursor-pointer' onClick={()=>{setCurrentChat(null)}}><FaArrowLeft fill='white'/></p>
          <img
            src={currentChat.groupChat ? "group.png.png" : avatar }
            className='h-10 w-10 rounded-full'
            alt={`${currentChat?.name}'s Avatar`}
          />
          <div>
            <p className={`text-white transition-all duration-300 ${showTyping ? 'text-sm' : ''}`}>{name}</p>
            <p className={`text-white transition-all duration-300 ${showTyping ? 'flex text-sm' : 'hidden'}`}>
              {currentChat.groupChat ? `${typerName.split(" ")[0]} is typing..` : "typing.."}
            </p>
          </div>
        </div>
        {currentChat.groupChat && (
          <p className='hover:cursor-pointer' onClick={() => setShowGroupInfo(true)}>
            <CiCircleInfo fill="white" />
          </p>
        )}
      </div>

      <div ref={messagesContainerRef} className='flex-grow overflow-y-auto p-4 no-scrollbar'>
        {currentMessages?.map((message) => (
          <Message
            key={message._id}
            isRight={message.sender._id === user?._id}
            content={message.content}
            time={message.createdAt}
            name={message.sender.name}
            avatar={message.sender.avatar}
          />
        ))}
      </div>

      <div className='h-24 min-h-[6rem] w-full p-4 flex items-center bg-[#262729] border-t-[0.1px] border-slate-700'>
        <input
          className='flex-grow h-12 px-4 rounded-l-full border border-gray-300 focus:outline-none focus:border-blue-500 text-white bg-[#2e3033]'
          placeholder='Send a message..'
          value={message}
          onChange={handleMessageChange}
        />
        <button
          className='h-12 px-6 bg-blue-500 text-white rounded-r-full hover:bg-blue-600 focus:outline-none'
          onClick={sendMessageHandler}
        >
          <IoMdSend />
        </button>
      </div></>)}
    </div>
  );
};

export default ChatPage;