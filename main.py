from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from database import SessionLocal, engine, EmployeeDB, Base

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI
app = FastAPI()

# Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace "*" with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic schema
class Employee(BaseModel):
    id: int | None = None  # Include ID to return to frontend
    name: str
    age: int
    department: str

    class Config:
        from_attributes = True

# Root endpoint
@app.get("/")
def root():
    return {"message": "Welcome to Employee Management API, Kanna!"}

# Get all employees
@app.get("/employees", response_model=List[Employee])
def get_employees(db: Session = Depends(get_db)):
    return db.query(EmployeeDB).all()

# Get employee by ID
@app.get("/employees/{emp_id}", response_model=Employee)
def get_employee(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(EmployeeDB).filter(EmployeeDB.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

# Add employee
@app.post("/employees", response_model=Employee)
def add_employee(emp: Employee, db: Session = Depends(get_db)):
    db_emp = EmployeeDB(
        name=emp.name,
        age=emp.age,
        department=emp.department
    )
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp

# Update employee
@app.put("/employees/{emp_id}", response_model=Employee)
def update_employee(emp_id: int, emp: Employee, db: Session = Depends(get_db)):
    db_emp = db.query(EmployeeDB).filter(EmployeeDB.id == emp_id).first()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db_emp.name = emp.name
    db_emp.age = emp.age
    db_emp.department = emp.department
    db.commit()
    db.refresh(db_emp)
    return db_emp

# Delete employee
@app.delete("/employees/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db)):
    db_emp = db.query(EmployeeDB).filter(EmployeeDB.id == emp_id).first()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(db_emp)
    db.commit()
    return {"detail": "Employee deleted successfully"}
