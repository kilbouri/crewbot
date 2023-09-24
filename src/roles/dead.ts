import {RoleType} from ".";

const deadRole: RoleType = {
    name: "Dead",
    getExpectedVoiceState: async (state) => {
        switch (state) {
            case "meeting":
                return {deaf: false, mute: true};
            case "playing":
                return {deaf: false, mute: false};
        }
    },
};

export {deadRole as role};
