from sqlalchemy import Column, Integer, String, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

# Association table for many-to-many relationship between Media and Tag
media_tag = Table(
    'media_tag', Base.metadata,
    Column('media_id', Integer, ForeignKey('media.id')),
    Column('tag_id', Integer, ForeignKey('tag.id'))
)

class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default='user')  # 'user' or 'admin'
    is_approved = Column(Integer, default=1)  # 1=True, 0=False; new users will be set to 0 in registration

class Genre(Base):
    __tablename__ = 'genre'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    media = relationship('Media', back_populates='genre')

class Tag(Base):
    __tablename__ = 'tag'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    media = relationship('Media', secondary=media_tag, back_populates='tags')

class Media(Base):
    __tablename__ = 'media'
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True)
    filepath = Column(String)
    genre_id = Column(Integer, ForeignKey('genre.id'))
    genre = relationship('Genre', back_populates='media')
    tags = relationship('Tag', secondary=media_tag, back_populates='media')
    uploader_id = Column(Integer, ForeignKey('user.id')) 

class AuditLog(Base):
    __tablename__ = 'audit_log'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    username = Column(String)
    action = Column(String)
    target_type = Column(String)
    target_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(String, nullable=True) 