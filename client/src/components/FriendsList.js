import {FriendCard} from "./FriendCard.js";
import {Loader} from "./ui/Loader.js";

export const FriendsList = ({friends, isLoading}) => {
    const imports = [FriendCard, Loader];

    const template = `
    <div class="fri__card-list">
        <$map items={friends} context="friend">
            <FriendCard
                age={friend.age}
                photoURL={friend.photoURL}
                firstName={friend.firstName}
                lastName={friend.lastName}
                city={friend.city}
                country={friend.country}
                email={friend.email}
                phoneNumber={friend.phoneNumber} />
        </$map>
        <$if true={isLoading}>
            <Loader/>            
        </$if>
    </div>`;

    const attach = {
        friends,
        isLoading,
    };

    return {imports, template, attach};
}