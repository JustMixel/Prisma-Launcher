import styles from "./RatingStars.module.css";

function RatingStars({ rating, onRate, interactive = false })
{
    return (
        <div className={styles["stars"]}>
            {Array.from({ length: 5 }, (_, i) => {
                const starNumber = i + 1;
                const isFilled = starNumber <= Math.round(rating);
                return (
                    <span
                        key={starNumber}
                        className={`${styles["star"]} ${isFilled ? styles["filled"] : styles["empty"]} ${interactive ? styles["clickable"] : ""}`}
                        onClick={interactive ? () => onRate(starNumber) : undefined}
                    >
                        {isFilled ? "★" : "☆"}
                    </span>
                );
            })}
        </div>
    );
}

export default RatingStars
