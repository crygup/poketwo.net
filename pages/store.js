import { loadStripe } from "@stripe/stripe-js";
import classNames from "classnames";
import Link from "next/link";
import { useState } from "react";
import { withSession } from "../helpers/session";
import styles from "../styles/store.module.scss";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

const Banner = () => (
    <div className="section">
        <div className="container has-text-centered">
            <p className="title is-2">Store</p>
        </div>
    </div>
);

const Item = ({ name, price, selected, onSelect }) => (
    <div className={classNames("column", styles.item)} onClick={onSelect}>
        <div
            className={classNames({
                "box has-shadow h-100": true,
                "has-background-link-dark": selected,
            })}
        >
            <p className="title is-4">{name}</p>
            <p className="subtitle is-5">${price} USD</p>
        </div>
    </div>
);

const Items = ({ user, items, onCheckout }) => {
    const [selected, setSelected] = useState(-1);
    const authenticated = user !== null;

    return (
        <>
            <div className="section">
                <div className="container has-text-centered">
                    <div className="columns">
                        {items.map(({ name, price }, idx) => (
                            <Item
                                name={name}
                                price={price}
                                key={idx}
                                selected={selected == idx}
                                onSelect={setSelected.bind(null, idx)}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="section">
                <div className="container has-text-centered">
                    <button
                        className="button is-link is-medium is-rounded has-shadow"
                        onClick={() => onCheckout(items[selected])}
                        disabled={!authenticated || selected === -1}
                    >
                        Checkout{selected !== -1 && <> (${items[selected].price})</>}
                    </button>
                </div>
            </div>
        </>
    );
};

const Authentication = ({ user }) => {
    const authenticated = user !== null;
    let file_ext, avatar_url;
    if (authenticated) {
        if (user.avatar) {
            file_ext = user.avatar.startsWith("a_") ? "gif" : "png";
            avatar_url = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${file_ext}`;
        } else {
            avatar_url = `https://cdn.discordapp.com/embed/avatars/${user.id % 5}.png`;
        }
    }
    return (
        <div className="section">
            <div className="container has-text-centered">
                {!authenticated && (
                    <Link href="/api/login">
                        <a className="button is-light is-rounded is-medium has-shadow">Login with Discord</a>
                    </Link>
                )}
                {authenticated && (
                    <>
                        <div className="columns is-centered">
                            <div className="column is-narrow">
                                <div className="box px-6">
                                    <figure className="image is-96x96 mb-5 mx-auto">
                                        <img
                                            className="profile-circle is-rounded"
                                            src={avatar_url}
                                            alt="Profile Picture"
                                        />
                                    </figure>
                                    <p className="title is-4">
                                        {user.username}#{user.discriminator}
                                    </p>
                                    <p className="subtitle is-5">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        <Link href="/api/logout">
                            <a className="button is-light is-rounded has-shadow">Logout</a>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

const Store = ({ user, items }) => {
    const handleCheckout = async item => {
        const stripe = await stripePromise;

        const response = await fetch("/api/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: item.price,
                user,
            }),
        });

        const session = await response.json();

        const result = await stripe.redirectToCheckout({
            sessionId: session.id,
        });

        if (result.error) {
            alert(result.error.message);
        }
    };

    return (
        <>
            <Banner />
            <Authentication user={user} />
            <Items user={user} items={items} onCheckout={handleCheckout} />
        </>
    );
};

export default Store;

export const getServerSideProps = withSession(async ({ req }) => {
    return {
        props: {
            user: req.session.get("user") ?? null,
            items: [
                { name: "500 Shards", price: 5 },
                { name: "1,100 Shards", price: 10 },
                { name: "2,400 Shards", price: 20 },
                { name: "5,600 Shards", price: 40 },
                { name: "15,000 Shards", price: 100 },
            ],
        },
    };
});
