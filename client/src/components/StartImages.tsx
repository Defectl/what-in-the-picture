import { Button, Center, Gapped, Input } from "@skbkontur/react-ui";
import { FC, useState } from "react";
import { Player } from "../types";

interface Props {
    hash: string;
    currPlayer?: Player 
    players?: Player[]
    setWordRound: (hash: string, word: string, mainPlayerId?: string) => void
}

export const StartImages: FC<Props> = ({ currPlayer, players, setWordRound, hash }) => {
    const mainPlayer = players?.find((player) => player.isMain === true);
    const currentPlayerIsMain = currPlayer?.id === mainPlayer?.id;
    const [word, setWord] = useState('');

    return (
        <Gapped gap={24} vertical>
            <Gapped gap={12} vertical>
                <span>
                    {currentPlayerIsMain ? 
                        'Посмотри на свои картинки и напиши любое слово, к котором подходила бы любая твоя картинка' : 
                        `Игрок ${mainPlayer?.name} пишет слово. А ты пока рассмотри свои картинки :)`}
                </span>
                {currentPlayerIsMain && (
                    <Gapped gap={8}>
                        <Input value={word} onValueChange={setWord} />
                        <Button onClick={() => setWordRound(hash, word, mainPlayer?.id)}>Показать слово всем</Button>
                    </Gapped>
                )}
            </Gapped>
            <Gapped gap={12} vertical>
                <span>Твои картинки на старте</span>
                <div style={{ margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '12px'}}>
                    {currPlayer?.imageIds?.map((image) => <img style={{ maxHeight: '400px', padding: '12px'}} key={image} src={`http://localhost:3001${image}`}/>)}
                </div>
            </Gapped>
        </Gapped> 
    );
};