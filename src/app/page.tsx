import Chat from '../components/Chat'; // Adjust this import based on your actual Chat component path
import RightSidebar from '../components/RightSidebar';
import '../styles/sidebar.css';

export default function Home() {
  return (
    <div className="app-layout">
      <main className="main-content h-screen">
        <Chat />
      </main>
      <RightSidebar />
    </div>
  );
}