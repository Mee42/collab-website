import crypto from 'crypto'
import {hostname} from "os"
import {Visit} from "./models/visit";
import {User} from "./models/user";

function hash(password , salt ) {
    let hash = crypto.createHash('sha256');
    hash.update(salt);
    hash.update(password);
    return hash.digest('hex');
}

export async function setPassword(user, password, needsPassword = false) {
       const salt = crypto.randomBytes(8).toString('hex');
       user.password = hash(password, salt);
       user.salt = salt;
       user.needsPassword = needsPassword;
       await user.save();
       return true;
}

export async function getUser(idNumber) {
    return User.findOne(idNumber).then((user) => {
            if(user !== undefined) {
                return user;
            } else {
                return Promise.reject(new Error("No such user."));
            }
        }
    );
}

export async function getMonitors() {
    return User.find({labMonitor: true}).then((users) => {
        if(users !== undefined) {
            return users;
        } else {
            return Promise.reject(new Error("No such users."));
        }
    });
}

export async function getUserByUsername(username) {
    return User.findOne({where: {username: username}}).then((user) => {
        if(user !== undefined) {
            return user;
        } else {
            return Promise.reject(new Error("No such user."));
        }
    });
}

export async function userExists(idNumber) {
    return User.findOne(idNumber).then(
        (user) => {
            if(user !== undefined) {
                return user;
            } else {
                return Promise.reject(new Error("No such user."));
            }
        });
}

export async function createUser(idNumber, username, name, password, labMonitor, exec, admin) {
    return userExists(idNumber).then(() => new Error("ID already in system!"), () => {
        return usernameAvailable(username).then(async () => {
            const salt = crypto.randomBytes(8).toString('hex');
            const hashSum = hash(password, salt);
            let newUser = new User();
            newUser.idNumber = idNumber;
            newUser.username = username;
            newUser.name = name;
            newUser.password = hashSum;
            newUser.salt = salt;
            newUser.labMonitor = labMonitor;
            newUser.exec = exec;
            newUser.admin = admin;
            await newUser.save();
            return true;
        },() => new Error("Username already in system!"));
    });
}

export function correctCreds(user, password) {
    return user.password === hash(password, user.salt);
}

export async function usernameAvailable(username) {
    return getUserByUsername(username).then(() => {
            return Promise.reject(new Error("User exists."));
    },() => {
        return Promise.resolve();
    });
}

export async function expirePassword(user) {
    user.needsPassword = true;
    return user.save();
}

export async function deleteUser(user) {
    return user.remove();
}

export async function grantPrivilege(user,grant) {
    if (grant === 'labMonitor') {
        user.labMonitor = true;
        return user.save();
    } else if (grant === 'exec') {
        user.exec = true;
        return user.save();
    } else if (grant === 'admin') {
        user.admin = true;
        return user.save();
    } else {
        return false;
    }
}

export async function changeNickname(user, newNickname) {
    user.nickname = newNickname;
    return user.save();
}

export async function changeUsername(user, newUsername) {
    user.username = newUsername;
    return user.save();
}

export async function changeName(user, newName) {
    user.name = newName;
    return user.save();
}

export async function clearDatabase() {
    if(hostname() === "collablabvm") {
        console.log("bruh moment prevented, you're welcome.");
        return;
    }
    let users = await User.find();
    for(let user of users) {
        await user.remove();
    }
    let swipes = await Visit.find();
    for(let swipe of swipes) {
        await swipe.remove();
    }
    return true;
}

export async function resetPassword(user) {
    await setPassword(user, user.idNumber.toString(), true);
    return expirePassword(user);
}
