import {Games} from "./database";

// todo: making this an actual class would be beneficial for semantics and DB performance

/**
 * @param voiceChannelId The id of the voice channel in which the game is taking place
 * @param controlPanelChannelId The id of the channel in which the game's control panel message is located
 * @param controlPanelMessageId The id of the message which represents the game's control panel
 * @returns An identifier for the game
 */
export const CreateGame = async (
    voiceChannelId: string,
    controlPanelChannelId: string,
    controlPanelMessageId: string
) => {
    const createdValue = await Games.create({
        channelId: voiceChannelId,
        controlPanelChannelId: controlPanelChannelId,
        controlPanelMessageId: controlPanelMessageId,
        state: "created",
    });

    return createdValue.dataValues.channelId;
};

/**
 * Starts a game. Staring is defined as moving from the "Created" phase to the
 * "Playing" phase. This is the bot's version of pressing the Play button in game.
 * @param gameId the id (provided by `CreateGame`) of the game to start
 */
export const StartGame = async (gameId: string) => {
    await Games.update({state: "playing"}, {where: {channelId: gameId}});
};

/**
 * Starts a meeting. As the name implies, the corresponding action in-game is
 * an emergency meeting being called, or a body being reported.
 * @param gameId the id (provided by `CreateGame`) of the game to start
 */
export const StartMeeting = async (gameId: string) => {
    await Games.update({state: "meeting"}, {where: {channelId: gameId}});
};

/**
 * Ends a meeting. As the name implies, the corresponding action in-game is
 * a meeting ending after the crew has voted.
 * @param gameId the id (provided by `CreateGame`) of the game to start
 */
export const EndMeeting = async (gameId: string) => {
    await Games.update({state: "playing"}, {where: {channelId: gameId}});
};
/**
 * Ends a game. The corresponding actions in-game include:
 * - the impostor(s) being voted out
 * - the impostor(s) killing enough crew
 * - the impostor(s) winning by sabotage
 * @param gameId the id (provided by `CreateGame`) of the game to start
 */
export const EndGame = async (gameId: string) => {
    await Games.destroy({where: {channelId: gameId}});
};

/**
 * Obtains the game, if it exists, that is ocurring within the provided channel.
 * @param channelId the id of the voice channel that the game is occuring in.
 * @returns A `Game` object, or `undefined` if one does not exist.
 */
export const GetGameInChannel = async (channelId: string) => {
    const dbEntry = await Games.findOne({where: {channelId: channelId}});
    return dbEntry?.dataValues;
};
