import {RoleType} from ".";

const deadRole: RoleType = {
    name: "Spectator",
    getExpectedVoiceState: async (state) => {
        switch (state) {
            case "meeting":
                return {deafened: false, muted: true};
            case "playing":
                return {deafened: false, muted: false};
        }
    },
};

export {deadRole as role};
