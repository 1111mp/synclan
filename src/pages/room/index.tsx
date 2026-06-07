import { useParams } from 'react-router';

function loader() {}

function RoomPage() {
  const params = useParams();
  console.log('Room ID:', params.id); // Log the room ID from the URL parameters

  return (
    <div>
      <h1>Room Page</h1>
      <p>This is the room page content.</p>
    </div>
  );
}

export { RoomPage as Component, loader };
