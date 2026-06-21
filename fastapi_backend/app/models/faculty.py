from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from .base import BaseModel

class Faculty(BaseModel):
  """User model for user's faculty."""

  __tablename__ = "faculties"
  name = Column(String(50), nullable=False)

  # Relationships
  users = relationship("User", back_populates="faculty")

  def __repr__(self):
      return f"<Faculty(id={self.id}, name='{self.name}')>"
