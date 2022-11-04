import express from "express";

export const internal = express.Router();
export const external = express.Router();
export const reloadOccupancyFromDB = async () => {
    let openVisits = await Visit.find({where: {outTime: null},relations: ["user"], order: {id: "DESC"}});
    for(let visit of openVisits) {
        console.log(visit);
        if (labStatus.members[visit.user.idNumber] === undefined) {
            labStatus.members[visit.user.idNumber] = visit.user;
			updateLabStatus();
            names[visit.user.username] = toDisp(visit.user);

        }
    }
}

import {getUser,getUserByUsername} from './userManagement'
import {authInRequest,idNumberInRequest,loggedIn,isValidNickname} from "./common";
import {Visit} from "./models/visit";
import { Responsibility } from "./models/responsibility";
import {MoreThan, LessThan} from "typeorm";

let labStatus = {
    open: "CLOSED",
    members: {}
};

let names = {};

internal.get('/status', function (req, res) {
    res.send({"open": labStatus.open, "members": names});
});

external.get('/status', function (req, res) {
    res.send({"open": labStatus.open, "members": names});
});

external.post('/visits', async (req, res) => {
    let visits = await getVisits(req.body.startDate,req.body.endDate);
    res.send(visits).end();
})

internal.post('/close',authInRequest, async (req, res) => {
    let user = req.user;
    if (user.labMonitor === true) {
        await closeLab();
        res.send('0').end();
    } else {
        res.end();
    }
});

internal.post('/swipe',idNumberInRequest, async (req, res) => {
    let user = req.user;
    if(user === undefined || user === null)
        res.send('2').end();
    else
        return await processSwipe(user, res);
});

external.post('/kick',loggedIn, async (req, res) => {
    let user = req.user;
    if (user.labMonitor !== true && user.exec !== true && user.admin !== true) {
        res.end();
    }
    await getUserByUsername(req.body.idNumber).then( async (user) => {
        await processSwipe(user, res);
    });
});

export async function addResponsibility(name) {
    let resp = new Responsibility();
    resp.name = name;
    console.log(resp);
    return resp.save();
}

export async function getResponsibilities() {
    return await Responsibility.find();
}

export async function closeLab() {
    labStatus.open = "CLOSED";
    for(const user of Object.values(labStatus.members)) {
        await swipeOut(user);
    }
}

export async function getVisits(startDate = new Date(0), endDate = new Date()) {
    return await Visit.find({inTime: MoreThan(startDate),outTime:LessThan(endDate),relations: ["user"],order: {id: "DESC"}});
}

export async function updateList()  {
    names = {};
    for (let idNumber in labStatus.members) {
        await getUser(idNumber).then( (user) => {
            names[user.username] = toDisp(user);
            labStatus.members[user.idNumber] = user;
        });
    }
}

async function processSwipe(user, res) {
    if (labStatus.members[user.idNumber] === undefined) {
        if (user.needsPassword === true) {
            res.send("4").end();
        } else {
            await swipeIn(user);
        }
    } else {
		await swipeOut(user);
    }
	updateLabStatus();
	res.send("0").end();
}

function updateLabStatus() {
	if(countPeopleInLab() == 0){
		labStatus.open = "CLOSED"
	} else if(countLabMonitorsInLab() == 0) {
		labStatus.open = "LIMITED"
	} else {
		labStatus.open = "OPEN"; // there are lab monitors
	}
}


async function swipeIn(user) {
    labStatus.members[user.idNumber] = user;
	updateLabStatus();
    names[user.username] = toDisp(user);
    let visit = new Visit();
    visit.user = user;
    visit.inTime = new Date();
    await visit.save();
}

function toDisp(user) {
    if (isValidNickname(user.nickname)) {
        return user.name + " (" + user.nickname + ")";
    }
    return user.name;
}

async function swipeOut(user) {
    console.log(user);
    delete labStatus.members[user.idNumber];
    delete names[user.username];
    let visit = await Visit.findOne({where:{outTime: null,user: user},relations:["user"], order: {id: "DESC"}});
    console.log(visit);
    visit.outTime = new Date();
    await visit.save();
}

function countLabMonitorsInLab() {
    let count = 0;
    for (let i in labStatus.members) {
        if (labStatus.members[i].labMonitor === true) {
            count += 1;
        }
    }
    return count;
}

// idk how else to do this lol
function countPeopleInLab() {
    let count = 0;
    for (let i in labStatus.members) {
		count += 1;
    }
    return count;
}



