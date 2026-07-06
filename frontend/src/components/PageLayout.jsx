export default function PageLayout({ children, isSidebarOpen }) {
  // pl-20 es el ancho cuando el sidebar está "colapsado" (solo iconos)
  // pl-72 es el ancho cuando está "expandido"
  return (
    <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'pl-72' : 'pl-20'} w-full min-h-screen`}>
      {children}
    </div>
  );
}