import { Request , Response } from "express"
import { SignupDTO } from "../dtos/signup.dto"
import { ErrorResponseDTO } from "../dtos/error.dto"
import { User } from "../models/user.schema";
import bcrypt from 'bcrypt'
import { SuccessResponseDTO } from '../dtos/success.dto';
import { LoginDTO } from "../dtos/login.dto";
import jwt from "jsonwebtoken"
import { AuthenticatRequest
 } from "../middlewares/auth.middleware";
 let errResponse:ErrorResponseDTO={
  success:false ,
  message:""
}

export const signup  = async (req: Request<{} , {} , SignupDTO>, res: Response):Promise<Response> => {
  try {
    const { name, email, password } = req.body;

    if (!name    || !email || !password) {
      const errorResponse: ErrorResponseDTO = {
        success: false,
        message: 'All fields (name, username, email, password) are required.',
      };
      return res.status(400).json(errorResponse);
    }

    const existingUser = await User.findOne({email:email})

    if(existingUser){
        const errorResponse: ErrorResponseDTO = {
            success: false,
            message: 'User Already Exists',
          };
          return res.status(400).json(errorResponse);
        }

         const hashedPassword = await  bcrypt.hash(password ,10) ;



    const newUser = await User.create({
        name ,
        email ,
        password:hashedPassword ,
        avatar:"ht" ,


    })

    const successResponse :SuccessResponseDTO<typeof newUser> ={
        success:true ,
        message:"User Registered Successfully",

    }

    return res.status(200).json(newUser)


  } catch (err) {
    console.log(err)
    
    const errorResponse: ErrorResponseDTO = {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
    return res.status(500).json(errorResponse);
  }
};


export const login  = async(req:Request<{} ,{} ,LoginDTO > , res:Response): Promise<Response> =>{

    try{
        const { email , password}=req.body
        console.log(email , password) 
        if( !email||  !password ){
            const errorResponse: ErrorResponseDTO = {
                success: false,
                message: 'All fields (name, username, email, password) are required.',
              };
              return res.status(400).json(errorResponse);
            }

        

  
       const  user = await User.findOne({email:email})
   

    if(!user){
        const errorResponse: ErrorResponseDTO = {
            success: false,
            message: 'No such User Found.',
          };
          return res.status(400).json(errorResponse);
        }
    if(!await bcrypt.compare(password , user.password)){
        const errorResponse: ErrorResponseDTO = {
            success: false,
            message: 'Incorrect Password',
          };
          return res.status(400).json(errorResponse);
        }


        const payload = {
            email:user.email ,
            id:user._id ,
        }
        const token = jwt.sign(payload , process.env.JWT_SECRET as string , {
            expiresIn:"2h"

        })
        const userData = {
          name:user.name ,
          email:user.email ,
          avatar:user.avatar , 
          _id:user._id
        }
        const data = {user:userData , token:token}

       
    
        const successResponse :SuccessResponseDTO<typeof data> ={

            success:true ,
            message:"User Registered Successfully",
            data:data
    
        }


    return res.status(200).json(successResponse)

    

    }catch(err){
      console.log(err)
        const errorResponse: ErrorResponseDTO = {
            success: false,
            message: 'An unexpected error occurred. Please try again later.',
          };
          return res.status(500).json(errorResponse);
        }

    }


    export const getUser = async(req:AuthenticatRequest<null> , res:Response)=>{
      try{

        const data = await User.findById(req.user.id).select("name email _id avatar")

        const successResponse :SuccessResponseDTO<typeof data>={
          success:true ,
          message:"User Details Fetched" ,
          data:data

        }

        return res.status(200).json(successResponse)

        

      }catch(err){
        errResponse.message="Internal Server Error"
        return res.status(500).json(errResponse)

      }
    }