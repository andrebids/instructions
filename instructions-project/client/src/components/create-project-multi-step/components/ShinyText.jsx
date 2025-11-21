import './ShinyText.css';

const ShinyText = ({ text, disabled = false, speed = 5, className = '' }) => {
    return (
        <div
            className={`shiny-text ${disabled ? 'disabled' : ''} ${className}`}
            style={{ '--animation-duration': `${speed}s` }}
            data-text={text}
        >
            {text}
        </div>
    );
};

export default ShinyText;
