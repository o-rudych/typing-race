export type User = {
    username: string;
    activeRoom: string;
    isReady: boolean;
    currentIndex: number;
    gameTime: number;
}

class UserService {

    private usersMap: Map<string, User> = new Map();

    createUser(name: string): User {
        const user: User = {
            username: name,
            activeRoom: '',
            isReady: false,
            currentIndex: 0,
            gameTime: 0
        };
        this.usersMap.set(name, user);
        return user;
    }
    allUsersAreReady(roomName: string): boolean {
        return [...this.usersMap.values()]
            .filter(user => user.activeRoom === roomName)
            .every(user => user.isReady);
    }

    getUserByName(name: string): User | undefined {
        return this.usersMap.get(name);
    }

    userExist(name: string): boolean {
        if (this.getUserByName(name)) return true
        else return false;
    }
    deleteUser(name: string): void {
        if (this.userExist(name)) {
            this.usersMap.delete(name);
        }
    }
}

export const userService = new UserService();