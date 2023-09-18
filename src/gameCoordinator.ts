import {Games} from "./database";

export const CreateGame = async (voiceChannelId: string, stateMessageId: string, stateChannelId: string) => {
    const createdValue = await Games.create({
        channelId: voiceChannelId,
        gameStateChannelId: stateChannelId,
        gameStateMessageId: stateMessageId,
        state: "created",
    });

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

export const GetGame = async (gameId: string) => {
    const dbEntry = await Games.findOne({where: {channelId: gameId}});
    return dbEntry!.dataValues;
};
