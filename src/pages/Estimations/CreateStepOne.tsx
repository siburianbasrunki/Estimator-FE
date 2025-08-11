import { useState } from "react";
import Input from "../../components/input";
import ImageProyek from "../../assets/images/image 1.png";
import { BiEdit, BiTrash, BiPlus } from "react-icons/bi";
import Button from "../../components/Button";

interface CustomField {
  id: string;
  label: string;
  value: string;
  type: string;
}

export const CreateStepOne = () => {
  const [formData, setFormData] = useState({
    projectName: "",
    owner: "",
    ppn: "",
    notes: ""
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomFieldChange = (id: string, value: string) => {
    setCustomFields(prev =>
      prev.map(field =>
        field.id === id ? { ...field, value } : field
      )
    );
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    
    const newField: CustomField = {
      id: Date.now().toString(),
      label: newFieldLabel,
      value: "",
      type: newFieldType
    };

    setCustomFields(prev => [...prev, newField]);
    setNewFieldLabel("");
    setNewFieldType("text");
  };

  const removeCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(field => field.id !== id));
  };

  const handleLog = () => {
    const allData = {
      ...formData,
      customFields: customFields.reduce((acc, field) => {
        acc[field.label] = field.value;
        return acc;
      }, {} as Record<string, string>)
    };
    console.log(allData);
  };

  return (
    <div className="mx-auto  px-4 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Create</h1>
      <div className="bg-white rounded-md shadow p-6">
        <p className="border-b-4 border-[#1814F3] w-fit rounded-t-md text-[#1814F3]">
          Profil Proyek
        </p>
        
        <div className="flex flex-col lg:flex-row gap-8 mt-6">
          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <Input
                label="Nama Proyek"
                placeholder="Masukan Nama Proyek"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
              />
              <Input
                label="Pemilik Proyek"
                placeholder="Masukan Nama Pemilik Proyek"
                name="owner"
                value={formData.owner}
                onChange={handleInputChange}
              />
              <Input 
                label="PPN" 
                name="ppn" 
                type="number" 
                value={formData.ppn}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Masukan Deskripsi Proyek"
                rows={4}
              />
            </div>

            <div className="space-y-4">
              {customFields.map(field => (
                <div key={field.id} className="flex items-start gap-3">
                  <div className="flex-1">
                    <Input
                      label={field.label}
                      name={`custom-${field.id}`}
                      type={field.type}
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => removeCustomField(field.id)}
                    className="mt-7 p-2 text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Remove field"
                  >
                    <BiTrash size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <div className="flex-1">
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Field Label"
                  className="block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="block w-full sm:w-32 p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="tel">Phone</option>
              </select>
              <button
                onClick={addCustomField}
                className="flex items-center justify-center gap-1 px-4 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <BiPlus size={18} /> Add Field
              </button>
            </div>
          </div>
          
          <div className="lg:w-1/3 flex flex-col items-center mt-6 lg:mt-0">
            <div className="relative w-full max-w-xs">
              <img 
                src={ImageProyek} 
                alt="Proyek" 
                className="w-full h-auto rounded-md border-2 border-gray-200 object-cover" 
              />
              <button className="absolute bottom-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors">
                <BiEdit className="text-blue-500" size={18} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <Button onClick={handleLog} className="px-6 py-2.5">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};