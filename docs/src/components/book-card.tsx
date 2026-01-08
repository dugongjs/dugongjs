export interface BookCardProps {
    title: string;
    author: string;
    description: string;
    image: string;
    link: string;
}

export default function BookCard({ title, author, image, link, description }: BookCardProps) {
    return (
        <div style={{ display: "flex", gap: 16 }}>
            <a href={link} style={{ flex: "none" }}>
                <img src={image} alt={title} width="200" />
            </a>
            <div>
                <strong>{title}</strong>
                <p>{author}</p>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    <strong>Description</strong>
                    <p>{description}</p>
                </div>
            </div>
        </div>
    );
}
