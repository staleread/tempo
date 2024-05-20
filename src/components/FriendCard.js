export const FriendCard = (props) => {
    const imports = [];

    const template = `
    <div class="fri__card-container">
        <p class="fri__age-label">{props.age}</p>
        <img class="fri__card-image" src={props.photoURL} alt="" />
        <h2>{props.firstName} {props.lastName}</h2>
        <p>{props.city}, {props.country}</p>
        <p>{props.email}</p>
        <p>{props.phoneNumber}</p>
    </div>`;

    const attach = {
        props
    };

    return {imports, template, attach};
}