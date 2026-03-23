import DiceRoll from "./[media_type]/[media_name_slug]/[id]/diceRoll";

export default function RandomLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <DiceRoll finishing={false} />
    </div>
  );
}