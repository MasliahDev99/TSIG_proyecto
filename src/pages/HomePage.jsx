import {Navbar,MapView,AdminLogin} from "@/components";
import {useState} from "react";






export default function HomePage(){
    const [currentView, setCurrentView] = useState("map");
    const [adminSection, setAdminSection] = useState("dashboard");
    const [editingId, setEditingId] = useState(null);

    // funcion para cambiar la vista actual
    const navigateTo = (view, section = null, id=null) => {
        setCurrentView(view);
        if (section){
            setAdminSection(section);
        }
        if (id){
            setEditingId(id);
        }
    }
    return(
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar currentView={currentView} navigateTo={navigateTo}/>
            
            <div className="flex-1 min-h-screen overflow-hidden">
                {currentView === "map" && <MapView/>}
                {currentView === "login" && <AdminLogin navigateTo={navigateTo}/>  }
                {currentView === "admin" && <h1 className="text-xl text-green-600">Esto es el admin</h1>  }
            </div>
        </div>
    )
}

