import {RoleType} from ".";

const aliveRole: RoleType = {
    name: "Alive",
    getExpectedVoiceState: async (state) => {
        switch (state) {
            case "meeting":
                return {deafened: false, muted: false};
            case "playing":
                return {deafened: true, muted: true};
        }
    },
};

export {aliveRole as role};
