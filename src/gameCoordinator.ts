import {Games} from "./database";

export const CreateGame = async (channelId: string) => {
    const createdValue = await Games.create({channelId, state: "created"});
    return createdValue.dataValues.channelId;
};

export const StartGame = async (gameId: string) => {
    await Games.update({state: "playing"}, {where: {channelId: gameId}});
};

export const StartMeeting = async (gameId: string) => {
    await Games.update({state: "meeting"}, {where: {channelId: gameId}});
};

export const EndMeeting = async (gameId: string) => {
    await Games.update({state: "playing"}, {where: {channelId: gameId}});
};

export const EndGame = async (gameId: string) => {
    await Games.destroy({where: {channelId: gameId}});
};
