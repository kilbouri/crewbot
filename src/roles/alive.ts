import {RoleType} from ".";

const aliveRole: RoleType = {
    name: "Alive",
    getExpectedVoiceState: async (state) => {
        switch (state) {
            case "meeting":
                return {deaf: false, mute: false};
            case "playing":
                return {deaf: true, mute: false};
        }
    },
};

export {aliveRole as role};
