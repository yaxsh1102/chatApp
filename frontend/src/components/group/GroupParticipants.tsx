import React from 'react'
import { MdDeleteForever } from 'react-icons/md'
import { User } from '../../interfaces/interfaces'
import { useAppContext } from '../../context/AppContext'
interface GroupParticpantProp{
member:User ,
isSearchResult?:boolean ,
isAdmin?:boolean

}



const GroupParticipants = ({member , isSearchResult=false , isAdmin=false}:GroupParticpantProp) => {
const {user , currentChat , chats , setChats , setCurrentChat} = useAppContext()


async function removeFromGroupHandler(){
  try{
    const data = await fetch(`${process.env.REACT_APP_BACKEND_URL}chat/remove-from-group`, {
      method:"POST" ,
      headers:{
        "content-type":"application/json" ,
        "Authorization":`Bearer ${localStorage.getItem("token")}`
      }
       , body:JSON.stringify({group:currentChat?._id , member:member._id})
    })


    
    console.log("hiiiiii")
    const resp = await data.json()
    console.log(resp)
      const newChats = chats.filter((chat)=>chat._id!==currentChat?._id)
      setChats([...newChats , resp.data])
      setCurrentChat(resp.data) 
    

    console.log(1212122)
    
  
    
  }catch(err){
  console.log(err)
  } 

}

 
  return (
    <div className='w-full border-b-[0.1px] border-b-slate-700'>
         <div className='flex justify-between  items-center h-16 mt-2 w-full'>
            <div className='flex items-center w-full'>
                <img src={member?.avatar} height={16} width={16} className='lg:h-12 lg:w-12 md:h-8 md:w-8' alt="" />
            <div className='flex flex-col px-4 w-full'>
                <div className='flex gap-x-2 w-full items-center'>
                <p>{member?.name}</p>
                {member?._id === currentChat?.admin?._id &&  <p className='w-18 text-sm px-2 text-center rounded-full bg-gray-600'> admin</p>}
                </div>

                <p className='text-xs '>{member?.email}</p>
            </div>

           {currentChat?.admin?._id===user?._id &&<p onClick={removeFromGroupHandler} className='hover:cursor-pointer'> <MdDeleteForever className='w-8 h-8'/></p> }


            </div>  

        </div>
    </div>
  )
}

export default GroupParticipants