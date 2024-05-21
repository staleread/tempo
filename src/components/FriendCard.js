export const FriendCard = (props) => {
    const imports = [];

    const template = `
    <div class="fri__card-container">
        <p class="fri__age-label">{props.age}</p>
        <img class="fri__card-image" src={props.photoURL} alt="" />
        <h2 class="fri__full-name">{props.firstName} {props.lastName}</h2>
        <p>{props.city}, {props.country}</p>
        <p class="fri__email">{props.email}</p>
        <p>{props.phoneNumber}</p>
    </div>`;

    const attach = {
        props
    };

    return {imports, template, attach};
}