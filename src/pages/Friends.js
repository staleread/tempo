import {Serianilla} from "../../framework/Serianilla.js";
import {fetchFriends, MOCK_fetchFriends} from "../http/FriendsAPI.js";
import {FriendsList} from "../components/FriendsList.js";
import {Button} from "../components/ui/Button.js";
import {InputText} from "../components/ui/InputText.js";

export const Friends = ({locationContext, notificationContext}) => {
    const [friends, setFriends] = Serianilla.useState([]);
    const [friendsChanged, setFriendsChanged] = Serianilla.useState(true);
    const [isLoading, setIsLoading] = Serianilla.useState(false);

    console.log(friends)

    Serianilla.useEffect(async () => {
        if (!friendsChanged) {
            return;
        }
        setIsLoading(true);
        try {
            setFriends(await fetchFriends());
            setFriendsChanged(false);
        } catch (err) {
            notificationContext.displayMessage('Error', err.message, 'error');
        }
        setIsLoading(false);
    }, [friendsChanged]);

    const imports = [FriendsList, Button, InputText];

    const template = `
    <div class="app__container">
        <header class="fri__header">
            <h1 class="fri__title">My Friends</h1>
            <Button content="Log out" classes="fri__button"/>
        </header>
        <section class="fri__header">
            <InputText placeholder="Search for friend" />
            <div class="fri__action-buttons">
                <Button content="Sort" classes="fri__button"/>
                <Button content="Filter" classes="fri__button"/>            
            </div>
        </section>
        <FriendsList friends={friends} isLoading={isLoading}/>
    </div>`;

    const attach = {
        friends,
        isLoading,
        rerender: () => setFriendsChanged(true),
    };

    return {imports, template, attach};
}