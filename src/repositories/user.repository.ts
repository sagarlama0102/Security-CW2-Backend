import { QueryFilter } from "mongoose";
import { UserModel, IUser } from "../models/user.model";
export interface IUserRepository {
    getUserByEmail(email: string): Promise<IUser | null>;
    getUserByUsername(username: string): Promise<IUser | null>;
    // Additional
    // 5 common database queries for entity
    createUser(userData: Partial<IUser>): Promise<IUser>;
    getUserById(id: string): Promise<IUser | null>;
    getAllUsers(
        page: number, size: number, search?: string
    ): Promise<{user:IUser[], total: number}>;
   
    updateOneUser(id:string, data:Partial<IUser>): Promise<IUser |null>; //update one
    deleteOneUser(id:string): Promise<boolean | null>; //delete one

    updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
    deleteUser(id: string): Promise<boolean>;
}
// MongoDb Implementation of UserRepository
export class UserRepository implements IUserRepository {
    async createUser(userData: Partial<IUser>): Promise<IUser> {
        const user = new UserModel(userData); 
        return await user.save();
    }
    async getUserByEmail(email: string): Promise<IUser | null> {
        const user = await UserModel.findOne({ "email": email })
        return user;
    }
    async getUserByUsername(username: string): Promise<IUser | null> {
        const user = await UserModel.findOne({ "username": username })
        return user;
    }

    async getUserById(id: string): Promise<IUser | null> {
        // UserModel.findOne({ "_id": id });
        const user = await UserModel.findById(id);
        return user;
    }
    async getAllUsers(
        page: number, size: number, search?: string
    ): Promise<{user: IUser[], total: number}> {
        const filter: QueryFilter<IUser> = {};
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
            ];
        }
        const [user, total] = await Promise.all([
            UserModel.find(filter)
                .skip((page -1)* size)
                .limit(size),
            UserModel.countDocuments(filter)
        ]);
        return { user, total};
        
    }
    async updateOneUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
        //UserModel.updateOne({"_id":id}, {$set:data})
        const updateUser = await UserModel.findByIdAndUpdate(id, data, {new:true});
        return updateUser;
    }
    async deleteOneUser(id: string): Promise<boolean | null> {
        //UserModel.deleteOne({"_id":id})
        const result = await UserModel.findByIdAndDelete(id);
        return result? true :null;
    }
    async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
        // UserModel.updateOne({ _id: id }, { $set: updateData });
        const updatedUser = await UserModel.findByIdAndUpdate(
            id, updateData, { new: true } // return the updated document
        );
        return updatedUser;
    }
    async deleteUser(id: string): Promise<boolean> {
        // UserModel.deleteOne({ _id: id });
        const result = await UserModel.findByIdAndDelete(id);
        return result ? true : false;
    }
    
}