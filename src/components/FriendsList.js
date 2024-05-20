import {FriendCard} from "./FriendCard.js";

export const FriendsList = ({friends}) => {
    const imports = [FriendCard];

    const template = `
    <div class="fri__card-list">
        <$map items={friends} context="friend">
            <FriendCard
                age={friend.age}
                photoURL={friend.age}
                firstName={friend.firstName}
                lastName={friend.lastName}
                city={friend.city}
                country={friend.country}
                email={friend.email}
                phoneNumber={friend.phoneNumber} />
        </$map>
    </div>`;

    const attach = {
        friends
    };

    return {imports, template, attach};
}